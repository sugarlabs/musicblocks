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

/* exported CallGraphAnalyzer */

/**
 * Pure call-graph analyzer for MusicBlocks workspaces.
 *
 * Scans block stacks to discover Action definitions, execution roots (Start/Drum),
 * action-call dependencies, dynamic/unresolved calls, missing definitions, and
 * recursive cycles (direct and indirect) without evaluating or mutating the workspace.
 */
class CallGraphAnalyzer {
    /**
     * @param {Array<Object>|Object} blockList - Workspace blocks (e.g. activity.blocks.blockList).
     * @param {Object} [options] - Optional analyzer settings.
     * @param {boolean} [options.includeRoots=true] - Whether to include Start stacks as root nodes.
     * @param {number} [options.maxTraversalDepth=1000] - Safety limit against malformed cyclic block connections.
     */
    constructor(blockList, options = {}) {
        this.blockList = blockList || [];
        this.options = {
            includeRoots: options.includeRoots !== false,
            maxTraversalDepth: options.maxTraversalDepth || 1000
        };
    }

    /**
     * Static helper to analyze a blockList directly.
     *
     * @param {Array<Object>|Object} blockList
     * @param {Object} [options]
     * @returns {Object} Graph analysis result.
     */
    static analyze(blockList, options) {
        return new CallGraphAnalyzer(blockList, options).analyze();
    }

    /**
     * Executes the call-graph analysis.
     *
     * @returns {Object} Immutable analysis result containing nodes, edges, cycles, and summary.
     */
    analyze() {
        const blocks = this._normalizeBlocks(this.blockList);
        const actionDefs = this._findActionDefinitions(blocks);
        const roots = this._findRoots(blocks);

        const nodesMap = new Map();
        const edges = [];
        const edgeKeySet = new Set();

        // 1. Register Action definition nodes
        for (const [name, def] of actionDefs.entries()) {
            const nodeId = `action:${name}`;
            nodesMap.set(nodeId, {
                id: nodeId,
                type: "action",
                blockId: def.blockId,
                label: name,
                actionName: name,
                isIncomplete: def.isIncomplete,
                isDuplicate: def.isDuplicate,
                duplicateBlockIds: def.duplicateBlockIds || [],
                isRecursive: false,
                callCount: 0,
                calledByCount: 0
            });
        }

        // 2. Register Start / execution root nodes
        if (this.options.includeRoots) {
            for (const root of roots) {
                const nodeId = `start:${root.id}`;
                nodesMap.set(nodeId, {
                    id: nodeId,
                    type: "start",
                    blockId: root.id,
                    label:
                        root.name === "start"
                            ? "Start"
                            : root.name.charAt(0).toUpperCase() + root.name.slice(1),
                    rootType: root.name,
                    isRecursive: false,
                    callCount: 0,
                    calledByCount: 0
                });
            }
        }

        // 3. Helper to record a call edge
        const addEdge = (callerNodeId, targetNodeId, callBlock, targetName, flags = {}) => {
            const edgeId = `edge:${callerNodeId}->${targetNodeId}:${callBlock.id}`;
            if (edgeKeySet.has(edgeId)) {
                return;
            }
            edgeKeySet.add(edgeId);

            edges.push({
                id: edgeId,
                source: callerNodeId,
                target: targetNodeId,
                callBlockId: callBlock.id,
                callType: callBlock.name,
                targetName: targetName,
                isRecursive: false,
                isMissing: !!flags.isMissing,
                isDynamic: !!flags.isDynamic
            });

            const sourceNode = nodesMap.get(callerNodeId);
            if (sourceNode) {
                sourceNode.callCount++;
            }
            const targetNode = nodesMap.get(targetNodeId);
            if (targetNode) {
                targetNode.calledByCount++;
            }
        };

        // 4. Traverse reachable blocks from caller contexts
        const traverseContext = (startBlockId, callerNodeId) => {
            if (startBlockId === null || startBlockId === undefined) {
                return;
            }
            const visited = new Set();
            const queue = [startBlockId];

            while (queue.length > 0 && visited.size < this.options.maxTraversalDepth) {
                const currId = queue.shift();
                if (currId === null || currId === undefined || visited.has(currId)) {
                    continue;
                }
                visited.add(currId);

                const block = blocks.get(currId);
                if (!block || block.trash) {
                    continue;
                }

                // If block is an Action Call block, inspect and record the call
                if (this._isActionCallBlock(block)) {
                    const callInfo = this._resolveCallTarget(block, blocks, actionDefs);
                    let targetNodeId;

                    if (callInfo.isDynamic) {
                        targetNodeId = `dynamic:${block.id}`;
                        if (!nodesMap.has(targetNodeId)) {
                            nodesMap.set(targetNodeId, {
                                id: targetNodeId,
                                type: "dynamic",
                                blockId: block.id,
                                label: "Dynamic Call",
                                isDynamic: true,
                                isRecursive: false,
                                callCount: 0,
                                calledByCount: 0
                            });
                        }
                    } else if (callInfo.isMissing) {
                        const missingLabel = callInfo.targetName
                            ? `${callInfo.targetName} (missing)`
                            : "Missing Target";
                        targetNodeId = `missing:${callInfo.targetName || `block_${block.id}`}`;
                        if (!nodesMap.has(targetNodeId)) {
                            nodesMap.set(targetNodeId, {
                                id: targetNodeId,
                                type: "missing",
                                label: missingLabel,
                                actionName: callInfo.targetName,
                                isMissing: true,
                                isRecursive: false,
                                callCount: 0,
                                calledByCount: 0
                            });
                        }
                    } else {
                        targetNodeId = `action:${callInfo.targetName}`;
                    }

                    addEdge(callerNodeId, targetNodeId, block, callInfo.targetName, callInfo);
                }

                // Push connected children to queue
                // Note: If block is an action definition, do not traverse into another action stack
                if (block.name === "action" && currId !== startBlockId) {
                    continue;
                }

                if (Array.isArray(block.connections)) {
                    const isOrdinaryCall = ["do", "calc", "doArg", "calcArg"].includes(block.name);
                    for (let i = 1; i < block.connections.length; i++) {
                        const childId = block.connections[i];
                        if (childId === null || childId === undefined) {
                            continue;
                        }

                        // For ordinary calls, connections[1] is the target name input block.
                        // If it is a literal text block, skip queuing it as executable code.
                        // If it is an expression, queue it so nested calls (e.g. calc) are discovered.
                        if (isOrdinaryCall && i === 1) {
                            const childBlock = blocks.get(childId);
                            if (
                                childBlock &&
                                (childBlock.name === "text" || childBlock.name === "string")
                            ) {
                                continue;
                            }
                        }

                        if (!visited.has(childId)) {
                            queue.push(childId);
                        }
                    }
                }
            }
        };

        // 5. Traverse from all Roots
        if (this.options.includeRoots) {
            for (const root of roots) {
                const callerNodeId = `start:${root.id}`;
                const rootBlock = root.block;
                if (rootBlock && Array.isArray(rootBlock.connections)) {
                    for (let i = 1; i < rootBlock.connections.length; i++) {
                        traverseContext(rootBlock.connections[i], callerNodeId);
                    }
                }
            }
        }

        // 6. Traverse from each Action definition body
        for (const [name, def] of actionDefs.entries()) {
            const callerNodeId = `action:${name}`;
            const actionBlock = blocks.get(def.blockId);
            if (
                actionBlock &&
                Array.isArray(actionBlock.connections) &&
                actionBlock.connections[2] !== null &&
                actionBlock.connections[2] !== undefined
            ) {
                traverseContext(actionBlock.connections[2], callerNodeId);
            }
        }

        // 7. Cycle & Recursion Analysis (Tarjan SCC on Action subgraph)
        const cycles = this._detectCycles(nodesMap, edges);
        const cycleNodeSet = new Set();
        const cycleEdgeSet = new Set();

        for (const cycle of cycles) {
            for (let i = 0; i < cycle.length; i++) {
                cycleNodeSet.add(cycle[i]);
                const next = cycle[(i + 1) % cycle.length];
                cycleEdgeSet.add(`${cycle[i]}->${next}`);
            }
        }

        // Update nodes and edges with recursion flags
        for (const node of nodesMap.values()) {
            if (cycleNodeSet.has(node.id)) {
                node.isRecursive = true;
            }
        }

        for (const edge of edges) {
            if (cycleEdgeSet.has(`${edge.source}->${edge.target}`)) {
                edge.isRecursive = true;
            }
        }

        // 8. Compute Summary
        const nodesList = Array.from(nodesMap.values());
        let recursiveActionsCount = 0;
        let missingTargetsCount = 0;
        let dynamicCallsCount = 0;
        let duplicateActionsCount = 0;

        for (const node of nodesList) {
            if (node.type === "action" && node.isRecursive) {
                recursiveActionsCount++;
            }
            if (node.type === "action" && node.isDuplicate) {
                duplicateActionsCount++;
            }
            if (node.type === "missing") {
                missingTargetsCount++;
            }
            if (node.type === "dynamic") {
                dynamicCallsCount++;
            }
        }

        return {
            nodes: nodesList,
            edges,
            cycles,
            hasCycles: cycles.length > 0,
            summary: {
                totalActions: actionDefs.size,
                totalStarts: roots.length,
                totalCalls: edges.length,
                recursiveActionsCount,
                missingTargetsCount,
                dynamicCallsCount,
                duplicateActionsCount
            }
        };
    }

    /**
     * Normalizes workspace block collections into an ID-indexed Map.
     *
     * @private
     * @param {Array<Object>|Object} blockList
     * @returns {Map<number, Object>}
     */
    _normalizeBlocks(blockList) {
        const map = new Map();
        if (!blockList) {
            return map;
        }

        const entries = Array.isArray(blockList) ? blockList.entries() : Object.entries(blockList);
        for (const [idx, block] of entries) {
            if (!block || typeof block !== "object") {
                continue;
            }
            const id = Number.isInteger(block.id) ? block.id : Number(idx);
            if (!Number.isNaN(id)) {
                map.set(id, block);
            }
        }
        return map;
    }

    /**
     * Identifies all valid Action definitions in the workspace.
     *
     * @private
     * @param {Map<number, Object>} blocks
     * @returns {Map<string, Object>} Map of actionName -> action definition info.
     */
    _findActionDefinitions(blocks) {
        const actionDefs = new Map();

        for (const [id, block] of blocks.entries()) {
            if (block.trash || block.name !== "action") {
                continue;
            }

            const nameInfo = this._resolveActionDefinitionName(block, blocks);
            const actionName = nameInfo.name;
            const isIncomplete =
                nameInfo.isIncomplete ||
                !Array.isArray(block.connections) ||
                block.connections[2] === null ||
                block.connections[2] === undefined;

            if (actionDefs.has(actionName)) {
                const existing = actionDefs.get(actionName);
                existing.isDuplicate = true;
                if (!existing.duplicateBlockIds) {
                    existing.duplicateBlockIds = [];
                }
                existing.duplicateBlockIds.push(id);
            } else {
                actionDefs.set(actionName, {
                    blockId: id,
                    name: actionName,
                    isIncomplete,
                    isDuplicate: false,
                    duplicateBlockIds: []
                });
            }
        }

        return actionDefs;
    }

    /**
     * Resolves the name of an Action definition block.
     *
     * @private
     * @param {Object} actionBlock
     * @param {Map<number, Object>} blocks
     * @returns {{ name: string, isIncomplete: boolean }}
     */
    _resolveActionDefinitionName(actionBlock, blocks) {
        if (
            !Array.isArray(actionBlock.connections) ||
            actionBlock.connections[1] === null ||
            actionBlock.connections[1] === undefined
        ) {
            return { name: `unnamed_${actionBlock.id}`, isIncomplete: true };
        }

        const nameChildId = actionBlock.connections[1];
        const nameBlock = blocks.get(nameChildId);
        if (!nameBlock || nameBlock.trash) {
            return { name: `unnamed_${actionBlock.id}`, isIncomplete: true };
        }

        let name = "";
        if (nameBlock.value !== undefined && nameBlock.value !== null) {
            name = String(nameBlock.value).trim();
        } else if (nameBlock.privateData !== undefined && nameBlock.privateData !== null) {
            name = String(nameBlock.privateData).trim();
        }

        if (!name) {
            return { name: `unnamed_${actionBlock.id}`, isIncomplete: true };
        }

        return { name, isIncomplete: false };
    }

    /**
     * Discovers execution roots (e.g. Start, Drum stacks).
     *
     * @private
     * @param {Map<number, Object>} blocks
     * @returns {Array<Object>}
     */
    _findRoots(blocks) {
        const roots = [];
        const rootNames = new Set(["start", "drum", "status", "oscilloscope"]);

        for (const [id, block] of blocks.entries()) {
            if (block.trash || !rootNames.has(block.name)) {
                continue;
            }
            // Root blocks must have connections[0] === null (top of stack)
            if (
                !Array.isArray(block.connections) ||
                block.connections[0] === null ||
                block.connections[0] === undefined
            ) {
                roots.push({ id, name: block.name, block });
            }
        }

        return roots;
    }

    /**
     * Tests whether a block represents an Action call.
     * Note: Variable assignment blocks such as `storein2` are explicitly excluded.
     *
     * @private
     * @param {Object} block
     * @returns {boolean}
     */
    _isActionCallBlock(block) {
        if (!block || block.trash) {
            return false;
        }

        const callTypes = new Set([
            "nameddo",
            "namedcalc",
            "nameddoArg",
            "namedcalcArg",
            "do",
            "calc",
            "doArg",
            "calcArg"
        ]);

        return callTypes.has(block.name);
    }

    /**
     * Resolves the target of an action call block.
     *
     * @private
     * @param {Object} callBlock
     * @param {Map<number, Object>} blocks
     * @param {Map<string, Object>} actionDefs
     * @returns {{ targetName: string, isMissing: boolean, isDynamic: boolean }}
     */
    _resolveCallTarget(callBlock, blocks, actionDefs) {
        const isNamedCall = ["nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].includes(
            callBlock.name
        );

        if (isNamedCall) {
            let targetName = "";
            if (callBlock.privateData !== undefined && callBlock.privateData !== null) {
                targetName = String(callBlock.privateData).trim();
            } else if (callBlock.value !== undefined && callBlock.value !== null) {
                targetName = String(callBlock.value).trim();
            }

            if (!targetName) {
                return { targetName: "", isMissing: true, isDynamic: false };
            }

            return {
                targetName,
                isMissing: !actionDefs.has(targetName),
                isDynamic: false
            };
        }

        // Ordinary calls: do, calc, doArg, calcArg
        if (
            !Array.isArray(callBlock.connections) ||
            callBlock.connections[1] === null ||
            callBlock.connections[1] === undefined
        ) {
            return { targetName: "", isMissing: true, isDynamic: false };
        }

        const targetChildId = callBlock.connections[1];
        const targetChildBlock = blocks.get(targetChildId);

        if (!targetChildBlock || targetChildBlock.trash) {
            return { targetName: "", isMissing: true, isDynamic: false };
        }

        // Check if target is a literal text/string block
        const isStaticText =
            (targetChildBlock.name === "text" || targetChildBlock.name === "string") &&
            targetChildBlock.value !== undefined &&
            targetChildBlock.value !== null;

        if (isStaticText) {
            const targetName = String(targetChildBlock.value || "").trim();
            if (!targetName) {
                return { targetName: "", isMissing: true, isDynamic: false };
            }
            return {
                targetName,
                isMissing: !actionDefs.has(targetName),
                isDynamic: false
            };
        }

        // Target is an expression / variable / non-literal block (e.g. box, plus, random)
        return { targetName: "", isMissing: false, isDynamic: true };
    }

    /**
     * Detects cycles in the Action dependency graph using Tarjan's SCC and DFS cycle paths.
     *
     * @private
     * @param {Map<string, Object>} nodesMap
     * @param {Array<Object>} edges
     * @returns {Array<Array<string>>} List of detected cycle paths (e.g. [["action:A", "action:B", "action:A"]]).
     */
    _detectCycles(nodesMap, edges) {
        // Build adjacency list for Action nodes only
        const adj = new Map();
        for (const [id, node] of nodesMap.entries()) {
            if (node.type === "action") {
                adj.set(id, []);
            }
        }

        for (const edge of edges) {
            if (adj.has(edge.source) && adj.has(edge.target)) {
                adj.get(edge.source).push(edge.target);
            }
        }

        const cycles = [];
        const visitedGlobal = new Set();

        // Find elementary cycles using DFS with recursion stack tracking
        for (const startNode of adj.keys()) {
            const path = [];
            const onPath = new Set();

            const dfs = curr => {
                path.push(curr);
                onPath.add(curr);

                const neighbors = adj.get(curr) || [];
                for (const next of neighbors) {
                    if (next === startNode) {
                        // Found a directed cycle back to startNode!
                        const fullCycle = [...path, startNode];
                        // Normalize cycle to avoid duplicate rotations
                        const cycleKey = this._getCanonicalCycleKey(fullCycle);
                        if (!visitedGlobal.has(cycleKey)) {
                            visitedGlobal.add(cycleKey);
                            cycles.push(fullCycle);
                        }
                    } else if (!onPath.has(next) && next > startNode) {
                        // Only explore nodes lexicographically greater than startNode to avoid rotation duplicates
                        dfs(next);
                    }
                }

                path.pop();
                onPath.delete(curr);
            };

            dfs(startNode);
        }

        return cycles;
    }

    /**
     * Produces a canonical string key for a cycle to deduplicate rotated variants.
     *
     * @private
     * @param {Array<string>} cycle
     * @returns {string}
     */
    _getCanonicalCycleKey(cycle) {
        // cycle format: [A, B, C, A] -> elements without the closing duplicate: [A, B, C]
        const elements = cycle.slice(0, -1);
        if (elements.length === 0) {
            return "";
        }

        let minIdx = 0;
        for (let i = 1; i < elements.length; i++) {
            if (elements[i] < elements[minIdx]) {
                minIdx = i;
            }
        }

        const rotated = elements.slice(minIdx).concat(elements.slice(0, minIdx));
        return rotated.join("->");
    }
}

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.CallGraphAnalyzer = CallGraphAnalyzer;
        return { CallGraphAnalyzer };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { CallGraphAnalyzer };
}
