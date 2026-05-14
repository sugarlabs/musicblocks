/* This worker handles the CPU-intensive project analysis and scoring logic
   to prevent blocking the main UI thread. */

const last = arr => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

self.onmessage = function (e) {
    const { blocks } = e.data;
    if (!blocks) {
        self.postMessage({ error: "No blocks provided" });
        return;
    }

    try {
        const scores = analyzeProjectInternal(blocks);
        self.postMessage({ scores });
    } catch (error) {
        self.postMessage({ error: error.message });
    }
};

function analyzeProjectInternal(blockList) {
    const projectStats = {
        blocks: 0,
        complexity: 0,
        uniqueness: 0,
        modularity: 0,
        audio: 0
    };

    if (!blockList || blockList.length === 0) return projectStats;

    const usedBlocks = blockList.filter(b => !b.trash);
    projectStats.blocks = usedBlocks.length;

    const blockNames = usedBlocks.map(b => b.name);
    const uniqueNames = new Set(blockNames);
    projectStats.uniqueness =
        projectStats.blocks > 0 ? (uniqueNames.size / projectStats.blocks) * 100 : 0;

    // Complexity based on nesting/connections
    let totalConnections = 0;
    usedBlocks.forEach(b => {
        if (b.connections) {
            totalConnections += b.connections.filter(c => c !== null).length;
        }
    });
    projectStats.complexity =
        projectStats.blocks > 0 ? (totalConnections / projectStats.blocks) * 20 : 0;

    // Modularity based on named action definitions
    const namedActions = usedBlocks.filter(b => b.name === "namedaction").length;
    projectStats.modularity = Math.min(namedActions * 20, 100);

    // Audio content
    const audioBlocks = usedBlocks.filter(b =>
        ["play", "sample", "synth"].some(kw => b.name.includes(kw))
    ).length;
    projectStats.audio = Math.min(audioBlocks * 15, 100);

    return projectStats;
}
