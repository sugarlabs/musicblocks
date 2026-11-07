// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* exported CallGraphLayout */

/**
 * Cycle-aware layered graph layout engine for the Code Map visualizer.
 *
 * Computes deterministic (x, y) coordinates for nodes and routes directed
 * bezier curves for forward calls, back-edges, and self-loops.
 */
class CallGraphLayout {
    /**
     * Computes coordinates and edge paths for a call-graph result.
     *
     * @param {Object} graphData - Result from CallGraphAnalyzer.analyze().
     * @param {Object} [options] - Layout options.
     * @returns {Object} Layout with positionedNodes, routedEdges, and bounds.
     */
    static compute(graphData, options = {}) {
        const { nodes = [], edges = [] } = graphData || {};
        if (nodes.length === 0) {
            return {
                positionedNodes: [],
                routedEdges: [],
                bounds: { minX: 0, minY: 0, maxX: 600, maxY: 400, width: 600, height: 400 }
            };
        }

        const nodeHeight = options.nodeHeight || 44;
        const rankGap = options.rankGap || 80;
        const colGap = options.colGap || 32;
        const padding = options.padding || 48;

        const nodeMap = new Map();
        for (const n of nodes) {
            const labelLen = (n.label || "").length;
            const width = Math.max(140, Math.min(220, labelLen * 9 + 48));
            nodeMap.set(n.id, {
                ...n,
                width,
                height: nodeHeight,
                rank: 0,
                x: 0,
                y: 0
            });
        }

        // 1. Assign Ranks (topological layering, ignoring feedback edges)
        const inDegree = new Map();
        const forwardAdj = new Map();
        for (const n of nodes) {
            inDegree.set(n.id, 0);
            forwardAdj.set(n.id, []);
        }

        for (const edge of edges) {
            if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
                // Ignore self-loops for rank assignment
                if (edge.source !== edge.target) {
                    forwardAdj.get(edge.source).push(edge.target);
                    inDegree.set(edge.target, inDegree.get(edge.target) + 1);
                }
            }
        }

        // Roots: Start nodes or nodes with 0 in-degree
        const roots = [];
        for (const n of nodes) {
            if (n.type === "start" || inDegree.get(n.id) === 0) {
                roots.push(n.id);
            }
        }

        // If no root has in-degree 0 (e.g. pure cycle), pick the lexicographically smallest node
        if (roots.length === 0 && nodes.length > 0) {
            const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
            roots.push(sorted[0].id);
        }

        // Assign ranks via BFS from roots
        const visitedRanks = new Set();
        const queue = roots.map(id => ({ id, rank: 0 }));

        while (queue.length > 0) {
            const { id, rank } = queue.shift();
            const currNode = nodeMap.get(id);
            if (!currNode) {
                continue;
            }

            if (rank > currNode.rank) {
                currNode.rank = rank;
            }

            if (visitedRanks.has(id)) {
                continue;
            }
            visitedRanks.add(id);

            const neighbors = forwardAdj.get(id) || [];
            for (const nextId of neighbors) {
                const nextNode = nodeMap.get(nextId);
                if (nextNode) {
                    const nextRank = rank + 1;
                    if (nextRank > nextNode.rank) {
                        nextNode.rank = nextRank;
                    }
                    if (!visitedRanks.has(nextId)) {
                        queue.push({ id: nextId, rank: nextRank });
                    }
                }
            }
        }

        // Any unvisited nodes (disconnected subgraphs)
        for (const n of nodes) {
            if (!visitedRanks.has(n.id)) {
                const currNode = nodeMap.get(n.id);
                if (currNode) {
                    currNode.rank = 0;
                }
            }
        }

        // 2. Group nodes into ranks and assign column positions
        const rankGroups = new Map();
        for (const n of nodeMap.values()) {
            if (!rankGroups.has(n.rank)) {
                rankGroups.set(n.rank, []);
            }
            rankGroups.get(n.rank).push(n);
        }

        const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
        let maxRankWidth = 0;

        for (const r of sortedRanks) {
            const group = rankGroups.get(r);
            // Deterministic sort within rank: starts first, then actions by label, then missing/dynamic
            group.sort((a, b) => {
                const order = { start: 1, action: 2, missing: 3, dynamic: 4 };
                const orderA = order[a.type] || 5;
                const orderB = order[b.type] || 5;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return (a.label || "").localeCompare(b.label || "");
            });

            let rankWidth = 0;
            for (let i = 0; i < group.length; i++) {
                rankWidth += group[i].width + (i > 0 ? colGap : 0);
            }
            if (rankWidth > maxRankWidth) {
                maxRankWidth = rankWidth;
            }
        }

        const centerX = padding + maxRankWidth / 2;

        // Position nodes
        for (const r of sortedRanks) {
            const group = rankGroups.get(r);
            const rankY = padding + r * (nodeHeight + rankGap);

            let totalGroupWidth = 0;
            for (let i = 0; i < group.length; i++) {
                totalGroupWidth += group[i].width + (i > 0 ? colGap : 0);
            }

            let startX = centerX - totalGroupWidth / 2;
            for (const n of group) {
                n.x = Math.round(startX + n.width / 2);
                n.y = Math.round(rankY + n.height / 2);
                startX += n.width + colGap;
            }
        }

        // 3. Route Edges
        const routedEdges = [];
        for (const edge of edges) {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) {
                continue;
            }

            let pathD = "";
            let markerType = edge.isRecursive ? "arrow-recursive" : "arrow-normal";

            if (src.id === tgt.id) {
                // Self-loop (direct recursion)
                const sx = src.x + src.width / 2;
                const sy = src.y;
                const loopW = 36;
                const loopH = 28;
                pathD = `M ${sx} ${sy - 8} C ${sx + loopW} ${sy - loopH}, ${sx + loopW} ${sy + loopH}, ${sx} ${sy + 8}`;
            } else if (tgt.rank > src.rank) {
                // Forward call (downwards)
                const sx = src.x;
                const sy = src.y + src.height / 2;
                const tx = tgt.x;
                const ty = tgt.y - tgt.height / 2;
                const deltaY = Math.max(24, (ty - sy) / 2);
                pathD = `M ${sx} ${sy} C ${sx} ${sy + deltaY}, ${tx} ${ty - deltaY}, ${tx} ${ty}`;
            } else if (tgt.rank === src.rank) {
                // Same-layer call
                const isLeft = src.x > tgt.x;
                const sx = src.x + (isLeft ? -src.width / 2 : src.width / 2);
                const sy = src.y;
                const tx = tgt.x + (isLeft ? tgt.width / 2 : -tgt.width / 2);
                const ty = tgt.y;
                const archH = 32;
                pathD = `M ${sx} ${sy} C ${sx} ${sy - archH}, ${tx} ${ty - archH}, ${tx} ${ty}`;
            } else {
                // Back-edge / upward cycle call
                const isLeftToRight = src.x <= tgt.x;
                const sideOffset = isLeftToRight ? 54 : -54;
                const sx = src.x + (isLeftToRight ? src.width / 2 : -src.width / 2);
                const sy = src.y;
                const tx = tgt.x + (isLeftToRight ? tgt.width / 2 : -tgt.width / 2);
                const ty = tgt.y;
                pathD = `M ${sx} ${sy} C ${sx + sideOffset} ${sy}, ${tx + sideOffset} ${ty}, ${tx} ${ty}`;
            }

            routedEdges.push({
                ...edge,
                pathD,
                markerType
            });
        }

        // 4. Compute overall bounds
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const n of nodeMap.values()) {
            minX = Math.min(minX, n.x - n.width / 2);
            minY = Math.min(minY, n.y - n.height / 2);
            maxX = Math.max(maxX, n.x + n.width / 2);
            maxY = Math.max(maxY, n.y + n.height / 2);
        }

        const positionedNodes = Array.from(nodeMap.values());
        const width = Math.max(640, Math.round(maxX - minX + padding * 2));
        const height = Math.max(420, Math.round(maxY - minY + padding * 2));

        return {
            positionedNodes,
            routedEdges,
            bounds: {
                minX: Math.round(minX - padding),
                minY: Math.round(minY - padding),
                maxX: Math.round(maxX + padding),
                maxY: Math.round(maxY + padding),
                width,
                height
            }
        };
    }
}

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.CallGraphLayout = CallGraphLayout;
        return { CallGraphLayout };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { CallGraphLayout };
}
