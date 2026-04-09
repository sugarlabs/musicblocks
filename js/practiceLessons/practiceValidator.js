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
        const blockList = this.getBlockList();
        const startBlock = Object.values(blockList).find(
            block => block?.name === "start" && !block.trash
        );
        if (!startBlock) return false;

        const sequence = this.extractPatternSequence(startBlock.connections?.[1], blockList);
        return JSON.stringify(sequence) === JSON.stringify(expectedPattern);
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
