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

const { CallGraphAnalyzer } = require("../CallGraphAnalyzer.js");

describe("CallGraphAnalyzer", () => {
    // 1. Empty workspace
    test("1. handles an empty workspace cleanly", () => {
        const result = CallGraphAnalyzer.analyze([]);
        expect(result.nodes).toEqual([]);
        expect(result.edges).toEqual([]);
        expect(result.cycles).toEqual([]);
        expect(result.hasCycles).toBe(false);
        expect(result.summary).toEqual({
            totalActions: 0,
            totalStarts: 0,
            totalCalls: 0,
            recursiveActionsCount: 0,
            missingTargetsCount: 0,
            dynamicCallsCount: 0,
            duplicateActionsCount: 0
        });
    });

    // 2. One Start stack
    test("2. discovers a single Start root stack without calls", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "forward", connections: [0, 2], trash: false },
            { id: 2, name: "number", value: 100, connections: [1], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.nodes).toHaveLength(1);
        expect(result.nodes[0]).toMatchObject({
            id: "start:0",
            type: "start",
            blockId: 0,
            label: "Start"
        });
        expect(result.edges).toHaveLength(0);
        expect(result.summary.totalStarts).toBe(1);
        expect(result.summary.totalActions).toBe(0);
    });

    // 3. One Action definition
    test("3. discovers an isolated Action definition", () => {
        const blocks = [
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "melody", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.nodes).toHaveLength(1);
        expect(result.nodes[0]).toMatchObject({
            id: "action:melody",
            type: "action",
            blockId: 10,
            label: "melody",
            actionName: "melody",
            isIncomplete: false,
            isRecursive: false
        });
        expect(result.edges).toHaveLength(0);
        expect(result.summary.totalActions).toBe(1);
    });

    // 4. Start calling an Action
    test("4. detects Start stack calling an Action via nameddo", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "nameddo", privateData: "intro", connections: [0], trash: false },
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "intro", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.nodes).toHaveLength(2);
        expect(result.edges).toHaveLength(1);
        expect(result.edges[0]).toMatchObject({
            id: "edge:start:0->action:intro:1",
            source: "start:0",
            target: "action:intro",
            callBlockId: 1,
            callType: "nameddo",
            targetName: "intro",
            isRecursive: false
        });
        expect(result.summary.totalCalls).toBe(1);
    });

    // 5. Action A calling Action B
    test("5. detects Action A calling Action B via ordinary do block", () => {
        const blocks = [
            // Action A: "main" calls "sub"
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "main", connections: [10], trash: false },
            { id: 12, name: "do", connections: [10, 13], trash: false },
            { id: 13, name: "text", value: "sub", connections: [12], trash: false },
            // Action B: "sub"
            { id: 20, name: "action", connections: [null, 21, 22], trash: false },
            { id: 21, name: "text", value: "sub", connections: [20], trash: false },
            { id: 22, name: "forward", connections: [20], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.nodes).toHaveLength(2);
        expect(result.edges).toHaveLength(1);
        expect(result.edges[0]).toMatchObject({
            source: "action:main",
            target: "action:sub",
            callBlockId: 12,
            callType: "do",
            targetName: "sub"
        });
        expect(result.hasCycles).toBe(false);
    });

    // 6. Multiple calls to the same Action (DAG, not a cycle)
    test("6. correctly handles multiple callers to the same Action without false cycle detection", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1, 2], trash: false },
            { id: 1, name: "nameddo", privateData: "shared", connections: [0], trash: false },
            { id: 2, name: "nameddo", privateData: "callerB", connections: [0], trash: false },
            // Action "callerB" also calls "shared"
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "callerB", connections: [10], trash: false },
            { id: 12, name: "nameddo", privateData: "shared", connections: [10], trash: false },
            // Action "shared"
            { id: 20, name: "action", connections: [null, 21, 22], trash: false },
            { id: 21, name: "text", value: "shared", connections: [20], trash: false },
            { id: 22, name: "forward", connections: [20], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.edges).toHaveLength(3);
        expect(result.hasCycles).toBe(false);
        expect(result.cycles).toHaveLength(0);
        const sharedNode = result.nodes.find(n => n.id === "action:shared");
        expect(sharedNode.calledByCount).toBe(2);
        expect(sharedNode.isRecursive).toBe(false);
    });

    // 7. Direct recursion: A -> A
    test("7. detects direct recursion (self-loop A -> A)", () => {
        const blocks = [
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "loopMe", connections: [10], trash: false },
            { id: 12, name: "nameddo", privateData: "loopMe", connections: [10], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.hasCycles).toBe(true);
        expect(result.cycles).toEqual([["action:loopMe", "action:loopMe"]]);
        expect(result.nodes[0].isRecursive).toBe(true);
        expect(result.edges[0].isRecursive).toBe(true);
        expect(result.summary.recursiveActionsCount).toBe(1);
    });

    // 8. Indirect recursion: A -> B -> A
    test("8. detects indirect mutual recursion (A -> B -> A)", () => {
        const blocks = [
            // Action A calls B
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "ping", connections: [10], trash: false },
            { id: 12, name: "nameddo", privateData: "pong", connections: [10], trash: false },
            // Action B calls A
            { id: 20, name: "action", connections: [null, 21, 22], trash: false },
            { id: 21, name: "text", value: "pong", connections: [20], trash: false },
            { id: 22, name: "nameddo", privateData: "ping", connections: [20], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.hasCycles).toBe(true);
        expect(result.cycles).toHaveLength(1);
        expect(result.cycles[0]).toContain("action:ping");
        expect(result.cycles[0]).toContain("action:pong");

        const nodePing = result.nodes.find(n => n.id === "action:ping");
        const nodePong = result.nodes.find(n => n.id === "action:pong");
        expect(nodePing.isRecursive).toBe(true);
        expect(nodePong.isRecursive).toBe(true);
        expect(result.edges.every(e => e.isRecursive)).toBe(true);
        expect(result.summary.recursiveActionsCount).toBe(2);
    });

    // 9. Multiple independent cycles
    test("9. detects multiple independent cycles (A -> B -> A and C -> D -> E -> C)", () => {
        const blocks = [
            // Cycle 1: A <-> B
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "A", connections: [10], trash: false },
            { id: 12, name: "nameddo", privateData: "B", connections: [10], trash: false },
            { id: 20, name: "action", connections: [null, 21, 22], trash: false },
            { id: 21, name: "text", value: "B", connections: [20], trash: false },
            { id: 22, name: "nameddo", privateData: "A", connections: [20], trash: false },

            // Cycle 2: C -> D -> E -> C
            { id: 30, name: "action", connections: [null, 31, 32], trash: false },
            { id: 31, name: "text", value: "C", connections: [30], trash: false },
            { id: 32, name: "nameddo", privateData: "D", connections: [30], trash: false },
            { id: 40, name: "action", connections: [null, 41, 42], trash: false },
            { id: 41, name: "text", value: "D", connections: [40], trash: false },
            { id: 42, name: "nameddo", privateData: "E", connections: [40], trash: false },
            { id: 50, name: "action", connections: [null, 51, 52], trash: false },
            { id: 51, name: "text", value: "E", connections: [50], trash: false },
            { id: 52, name: "nameddo", privateData: "C", connections: [50], trash: false },

            // Non-cycle action: F
            { id: 60, name: "action", connections: [null, 61, 62], trash: false },
            { id: 61, name: "text", value: "F", connections: [60], trash: false },
            { id: 62, name: "forward", connections: [60], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.cycles).toHaveLength(2);
        expect(result.summary.recursiveActionsCount).toBe(5);

        const nodeF = result.nodes.find(n => n.id === "action:F");
        expect(nodeF.isRecursive).toBe(false);
    });

    // 10. Unresolved static Action name (missing definition)
    test("10. reports unresolved static Action name as missing node", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "nameddo", privateData: "ghostAction", connections: [0], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.nodes).toHaveLength(2);
        const missingNode = result.nodes.find(n => n.type === "missing");
        expect(missingNode).toBeDefined();
        expect(missingNode).toMatchObject({
            id: "missing:ghostAction",
            type: "missing",
            actionName: "ghostAction",
            isMissing: true
        });
        expect(result.edges[0].isMissing).toBe(true);
        expect(result.summary.missingTargetsCount).toBe(1);
    });

    // 11. Dynamic Action name
    test("11. classifies non-literal target expressions as dynamic calls without guessing", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "do", connections: [0, 2], trash: false },
            // connections[1] of "do" connects to a variable box, not a literal text block
            { id: 2, name: "box", value: "myVar", connections: [1], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        const dynamicNode = result.nodes.find(n => n.type === "dynamic");
        expect(dynamicNode).toBeDefined();
        expect(dynamicNode).toMatchObject({
            id: "dynamic:1",
            type: "dynamic",
            blockId: 1,
            isDynamic: true
        });
        expect(result.edges[0].isDynamic).toBe(true);
        expect(result.summary.dynamicCallsCount).toBe(1);
    });

    // 12. Missing name input on call block
    test("12. handles missing name input on an ordinary call block cleanly", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            // "do" block with empty connections[1]
            { id: 1, name: "do", connections: [0, null], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        const missingNode = result.nodes.find(n => n.type === "missing");
        expect(missingNode).toBeDefined();
        expect(result.summary.missingTargetsCount).toBe(1);
    });

    // 13. Incomplete Action definition
    test("13. marks incomplete Action definition (null name or clamp)", () => {
        const blocks = [
            // Action without name block
            { id: 10, name: "action", connections: [null, null, 12], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false },
            // Action without clamp body
            { id: 20, name: "action", connections: [null, 21, null], trash: false },
            { id: 21, name: "text", value: "emptyBody", connections: [20], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.nodes).toHaveLength(2);
        expect(result.nodes.every(n => n.isIncomplete)).toBe(true);
    });

    // 14. Trashed Action definition
    test("14. excludes trashed Action definitions and their internal calls", () => {
        const blocks = [
            { id: 10, name: "action", connections: [null, 11, 12], trash: true },
            { id: 11, name: "text", value: "deletedAction", connections: [10], trash: true },
            { id: 12, name: "nameddo", privateData: "other", connections: [10], trash: true }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.nodes).toHaveLength(0);
        expect(result.edges).toHaveLength(0);
        expect(result.summary.totalActions).toBe(0);
    });

    // 15. Trashed call block
    test("15. ignores trashed call blocks in an active stack", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "nameddo", privateData: "intro", connections: [0], trash: true },
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "intro", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.edges).toHaveLength(0);
        expect(result.summary.totalCalls).toBe(0);
    });

    // 16. Missing or malformed connections
    test("16. handles missing or malformed connections gracefully without crashing", () => {
        const blocks = [
            null,
            undefined,
            {},
            { id: 1, name: "action", connections: "malformed", trash: false },
            { id: 2, name: "nameddo", connections: [9999], trash: false },
            { id: 3, name: "start", connections: null, trash: false }
        ];

        expect(() => CallGraphAnalyzer.analyze(blocks)).not.toThrow();
        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result).toBeDefined();
    });

    // 17. Duplicate Action names
    test("17. tracks duplicate Action definitions with same name without collision", () => {
        const blocks = [
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "chorus", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false },

            { id: 20, name: "action", connections: [null, 21, 22], trash: false },
            { id: 21, name: "text", value: "chorus", connections: [20], trash: false },
            { id: 22, name: "back", connections: [20], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.summary.totalActions).toBe(1);
        expect(result.summary.duplicateActionsCount).toBe(1);
        const node = result.nodes.find(n => n.id === "action:chorus");
        expect(node.isDuplicate).toBe(true);
        expect(node.duplicateBlockIds).toContain(20);
    });

    // 18. Large workspace behavior
    test("18. efficiently analyzes a large workspace with 60 blocks", () => {
        const blocks = [];
        // Create 20 actions chained: action_0 -> action_1 -> ... -> action_19
        for (let i = 0; i < 20; i++) {
            const actId = i * 3;
            const textId = actId + 1;
            const callId = actId + 2;
            const nextName = `action_${(i + 1) % 20}`; // Creates a 20-node cycle!

            blocks.push({
                id: actId,
                name: "action",
                connections: [null, textId, callId],
                trash: false
            });
            blocks.push({
                id: textId,
                name: "text",
                value: `action_${i}`,
                connections: [actId],
                trash: false
            });
            blocks.push({
                id: callId,
                name: "nameddo",
                privateData: nextName,
                connections: [actId],
                trash: false
            });
        }

        const t0 = Date.now();
        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        const elapsed = Date.now() - t0;

        expect(elapsed).toBeLessThan(100);
        expect(result.summary.totalActions).toBe(20);
        expect(result.summary.totalCalls).toBe(20);
        expect(result.hasCycles).toBe(true);
        expect(result.summary.recursiveActionsCount).toBe(20);
    });

    // 19. Correct preservation of call-site identity
    test("19. preserves exact call-site block ID on edges", () => {
        const blocks = [
            { id: 10, name: "action", connections: [null, 11, 42], trash: false },
            { id: 11, name: "text", value: "caller", connections: [10], trash: false },
            {
                id: 42,
                name: "namedcalc",
                privateData: "targetAction",
                connections: [10],
                trash: false
            },
            { id: 20, name: "action", connections: [null, 21, 22], trash: false },
            { id: 21, name: "text", value: "targetAction", connections: [20], trash: false },
            { id: 22, name: "forward", connections: [20], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.edges).toHaveLength(1);
        expect(result.edges[0].callBlockId).toBe(42);
        expect(result.edges[0].callType).toBe("namedcalc");
    });

    // 20. No mutation of source block data
    test("20. guarantees source block data is not mutated", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "nameddo", privateData: "myAct", connections: [0], trash: false },
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "myAct", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false }
        ];

        const snapshot = JSON.stringify(blocks);
        CallGraphAnalyzer.analyze(blocks);
        expect(JSON.stringify(blocks)).toBe(snapshot);
    });

    // Semantic distinction: storein2 is NOT an action call
    test("distinguishes variable assignment storein2 from action calls", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "storein2", connections: [0, 2, 3], trash: false },
            { id: 2, name: "text", value: "myVar", connections: [1], trash: false },
            { id: 3, name: "number", value: 42, connections: [1], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.edges).toHaveLength(0);
        expect(result.summary.totalCalls).toBe(0);
    });

    // Nested call inside flow clamp (e.g. repeat block)
    test("traverses calls nested inside flow clamps (e.g. repeat)", () => {
        const blocks = [
            { id: 0, name: "start", connections: [null, 1], trash: false },
            { id: 1, name: "repeat", connections: [0, 2, 3], trash: false },
            { id: 2, name: "number", value: 4, connections: [1], trash: false },
            { id: 3, name: "nameddo", privateData: "accent", connections: [1], trash: false },
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "accent", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.edges).toHaveLength(1);
        expect(result.edges[0].target).toBe("action:accent");
    });

    // Object-form blockList dictionary
    test("accepts dictionary object format for blockList", () => {
        const blocksDict = {
            0: { id: 0, name: "start", connections: [null, 1], trash: false },
            1: { id: 1, name: "nameddo", privateData: "play", connections: [0], trash: false },
            10: { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            11: { id: 11, name: "text", value: "play", connections: [10], trash: false },
            12: { id: 12, name: "forward", connections: [10], trash: false }
        };

        const result = CallGraphAnalyzer.analyze(blocksDict);
        expect(result.nodes).toHaveLength(2);
        expect(result.edges).toHaveLength(1);
    });

    // Action name resolved from privateData
    test("resolves action name from privateData when value is absent", () => {
        const blocks = [
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", privateData: "customName", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false }
        ];

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.nodes[0].actionName).toBe("customName");
    });

    test("26. handles a large layered chain of 25 actions with duplicate calls quickly without false cycles", () => {
        // A_0 -> A_1 (twice), A_1 -> A_2 (twice) ... A_24
        const blocks = [];
        let idCounter = 1;

        for (let i = 0; i < 25; i++) {
            const actionId = idCounter++;
            const textId = idCounter++;
            const actionName = `action_${i}`;

            // Name block
            blocks.push({
                id: textId,
                name: "text",
                value: actionName,
                connections: [actionId],
                trash: false
            });

            if (i < 24) {
                const nextActionName = `action_${i + 1}`;
                const call1Id = idCounter++;
                const call2Id = idCounter++;

                blocks.push({
                    id: actionId,
                    name: "action",
                    connections: [null, textId, call1Id],
                    trash: false
                });

                blocks.push({
                    id: call1Id,
                    name: "nameddo",
                    privateData: nextActionName,
                    connections: [actionId, call2Id],
                    trash: false
                });

                blocks.push({
                    id: call2Id,
                    name: "nameddo",
                    privateData: nextActionName,
                    connections: [call1Id],
                    trash: false
                });
            } else {
                blocks.push({
                    id: actionId,
                    name: "action",
                    connections: [null, textId, null],
                    trash: false
                });
            }
        }

        const startTime = Date.now();
        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(500);
        expect(result.hasCycles).toBe(false);
        expect(result.summary.recursiveActionsCount).toBe(0);
        expect(result.cycles).toHaveLength(0);
        expect(result.nodes).toHaveLength(25);
    });

    test("27. traverses large stacks (> 1000 blocks) without dropping calls when maxTraversalDepth is Infinity", () => {
        const blocks = [];
        let idCounter = 1;

        // Action definition
        const actionDefId = idCounter++;
        const nameBlockId = idCounter++;
        blocks.push({
            id: nameBlockId,
            name: "text",
            value: "largeStackAction",
            connections: [actionDefId],
            trash: false
        });

        // Target action definition
        const targetActionId = idCounter++;
        const targetNameId = idCounter++;
        blocks.push({
            id: targetNameId,
            name: "text",
            value: "targetAction",
            connections: [targetActionId],
            trash: false
        });
        blocks.push({
            id: targetActionId,
            name: "action",
            connections: [null, targetNameId, null],
            trash: false
        });

        // Build a long chain of 1200 dummy flow blocks, with a call to targetAction at position 1100
        let prevId = actionDefId;
        const totalBlocks = 1200;
        const callPosition = 1100;

        for (let i = 0; i < totalBlocks; i++) {
            const currId = idCounter++;
            if (i === callPosition) {
                blocks.push({
                    id: currId,
                    name: "nameddo",
                    privateData: "targetAction",
                    connections: [prevId],
                    trash: false
                });
            } else {
                blocks.push({
                    id: currId,
                    name: "forward",
                    connections: [prevId],
                    trash: false
                });
            }
            if (i === 0) {
                blocks.push({
                    id: actionDefId,
                    name: "action",
                    connections: [null, nameBlockId, currId],
                    trash: false
                });
            } else {
                const prevBlock = blocks.find(b => b.id === prevId);
                if (prevBlock && prevBlock.name !== "action") {
                    prevBlock.connections.push(currId);
                }
            }
            prevId = currId;
        }

        const result = CallGraphAnalyzer.analyze(blocks, { includeRoots: false });
        expect(result.edges.some(e => e.target === "action:targetAction")).toBe(true);
    });

    test("handles edge cases: null blockList, trashed or whitespace action names", () => {
        const analyzer = new CallGraphAnalyzer(null);
        const emptyMap = analyzer._normalizeBlocks(null);
        expect(emptyMap.size).toBe(0);

        // Action definition with trashed name block
        const trashedNameResult = CallGraphAnalyzer.analyze([
            { id: 1, name: "action", connections: [null, 2, 3], trash: false },
            { id: 2, name: "text", value: "trashedAction", trash: true },
            { id: 3, name: "forward", connections: [1], trash: false }
        ]);
        expect(trashedNameResult.nodes[0].isIncomplete).toBe(true);
        expect(trashedNameResult.nodes[0].label).toContain("unnamed_");

        // Action definition with whitespace-only name
        const whitespaceNameResult = CallGraphAnalyzer.analyze([
            { id: 1, name: "action", connections: [null, 2, 3], trash: false },
            { id: 2, name: "text", value: "    ", trash: false },
            { id: 3, name: "forward", connections: [1], trash: false }
        ]);
        expect(whitespaceNameResult.nodes[0].isIncomplete).toBe(true);
        expect(whitespaceNameResult.nodes[0].label).toContain("unnamed_");
    });

    test("handles named calls with value instead of privateData and empty target names", () => {
        // Named call with value instead of privateData
        const resultWithValue = CallGraphAnalyzer.analyze([
            { id: 1, name: "action", connections: [null, 2, 3], trash: false },
            { id: 2, name: "text", value: "actTarget", trash: false },
            { id: 3, name: "forward", connections: [1], trash: false },
            { id: 4, name: "start", connections: [null, 5], trash: false },
            { id: 5, name: "nameddo", value: "actTarget", trash: false }
        ]);
        expect(resultWithValue.edges[0].target).toBe("action:actTarget");

        // Named call with blank target name
        const resultBlankNamed = CallGraphAnalyzer.analyze([
            { id: 1, name: "start", connections: [null, 2], trash: false },
            { id: 2, name: "nameddo", privateData: "   ", trash: false }
        ]);
        expect(resultBlankNamed.edges[0].target).toContain("missing:");

        // Ordinary call with trashed target block
        const resultTrashedTarget = CallGraphAnalyzer.analyze([
            { id: 1, name: "start", connections: [null, 2], trash: false },
            { id: 2, name: "do", connections: [1, 3], trash: false },
            { id: 3, name: "text", value: "foo", trash: true }
        ]);
        expect(resultTrashedTarget.edges[0].target).toContain("missing:");

        // Ordinary call with blank string in target text block
        const resultBlankOrdinary = CallGraphAnalyzer.analyze([
            { id: 1, name: "start", connections: [null, 2], trash: false },
            { id: 2, name: "do", connections: [1, 3], trash: false },
            { id: 3, name: "text", value: "   ", trash: false }
        ]);
        expect(resultBlankOrdinary.edges[0].target).toContain("missing:");
    });

    test("handles queue edge cases, nested actions, and _isActionCallBlock safety checks", () => {
        const analyzer = new CallGraphAnalyzer([]);
        expect(analyzer._isActionCallBlock(null)).toBe(false);
        expect(analyzer._isActionCallBlock({ trash: true, name: "do" })).toBe(false);

        // Root block with null connection targets (exercises startBlockId === null)
        const nullConnResult = CallGraphAnalyzer.analyze([
            { id: 1, name: "start", connections: [null, null], trash: false }
        ]);
        expect(nullConnResult.summary.totalStarts).toBe(1);

        // Circular connection between two blocks (exercises visited.has in queue)
        const circularConnResult = CallGraphAnalyzer.analyze([
            { id: 1, name: "start", connections: [null, 2], trash: false },
            { id: 2, name: "forward", connections: [1, 3], trash: false },
            { id: 3, name: "forward", connections: [2, 2], trash: false }
        ]);
        expect(circularConnResult.summary.totalStarts).toBe(1);

        // Nested action definition attached inside an action stack
        const nestedActionResult = CallGraphAnalyzer.analyze([
            { id: 1, name: "action", connections: [null, 2, 3], trash: false },
            { id: 2, name: "text", value: "outerAction", trash: false },
            { id: 3, name: "forward", connections: [1, 4], trash: false },
            { id: 4, name: "action", connections: [3, 5, 6], trash: false },
            { id: 5, name: "text", value: "innerAction", trash: false },
            { id: 6, name: "nameddo", privateData: "innerTarget", trash: false }
        ]);
        expect(nestedActionResult.summary.totalActions).toBe(2);

        // Duplicate edge insertion attempt
        const blocksWithDupCall = [
            { id: 1, name: "start", connections: [null, 2], trash: false },
            { id: 2, name: "nameddo", privateData: "actX", connections: [1, 2], trash: false },
            { id: 3, name: "action", connections: [null, 4, null], trash: false },
            { id: 4, name: "text", value: "actX", trash: false }
        ];
        const dupResult = CallGraphAnalyzer.analyze(blocksWithDupCall);
        expect(dupResult.edges).toHaveLength(1);
    });

    test("exercises DFS cycle extraction with dead-ends, outside-SCC edges, and empty cycle key", () => {
        const analyzer = new CallGraphAnalyzer([]);
        expect(analyzer._getCanonicalCycleKey([])).toBe("");

        // Construct an SCC where DFS backtracks:
        // A -> Branch1 -> DeadEnd (dead-end within SCC)
        // A -> Branch2 -> A (cycle!)
        const adj = new Map([
            [
                "action:A",
                new Set(["action:0_Outside", "action:Branch1", "action:Branch2", "action:Outside"])
            ],
            ["action:0_Outside", new Set()],
            ["action:Branch1", new Set(["action:DeadEnd"])],
            ["action:DeadEnd", new Set()],
            ["action:Branch2", new Set(["action:A"])],
            ["action:Outside", new Set()]
        ]);
        const sccSet = new Set(["action:A", "action:Branch1", "action:DeadEnd", "action:Branch2"]);

        const cycle = analyzer._extractRepresentativeCycle("action:A", sccSet, adj);
        expect(cycle).toEqual(["action:A", "action:Branch2", "action:A"]);
    });

    test("handles cyclic and duplicate block connections safely during traversal", () => {
        const blocks = [
            { id: 1, name: "start", connections: [null, 2] },
            { id: 2, name: "forward", connections: [1, 3, 4] },
            { id: 3, name: "forward", connections: [2, 5] },
            { id: 4, name: "forward", connections: [2, 5] },
            { id: 5, name: "right", connections: [3, null] }
        ];
        const result = CallGraphAnalyzer.analyze(blocks);
        expect(result.nodes.length).toBe(1);
        expect(result.nodes[0].id).toBe("start:1");
    });

    test("exercises AMD define branch when define is available", () => {
        const origDefine = global.define;
        let registeredFactory;
        global.define = jest.fn(factory => {
            registeredFactory = factory;
        });
        global.define.amd = true;

        jest.isolateModules(() => {
            require("../CallGraphAnalyzer.js");
        });

        expect(global.define).toHaveBeenCalled();
        if (registeredFactory) {
            const exported = registeredFactory();
            expect(exported.CallGraphAnalyzer).toBeDefined();
        }
        global.define = origDefine;
    });
});
