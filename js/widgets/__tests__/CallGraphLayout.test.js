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

const { CallGraphLayout } = require("../CallGraphLayout.js");

describe("CallGraphLayout", () => {
    test("handles empty graph safely with fallback dimensions", () => {
        const layout = CallGraphLayout.compute({ nodes: [], edges: [] });
        expect(layout.positionedNodes).toEqual([]);
        expect(layout.routedEdges).toEqual([]);
        expect(layout.bounds.width).toBeGreaterThanOrEqual(600);
        expect(layout.bounds.height).toBeGreaterThanOrEqual(400);
    });

    test("computes deterministic coordinates for a single node", () => {
        const graph = {
            nodes: [{ id: "action:melody", type: "action", label: "melody" }],
            edges: []
        };
        const layout = CallGraphLayout.compute(graph);
        expect(layout.positionedNodes).toHaveLength(1);
        const node = layout.positionedNodes[0];
        expect(node.x).toBeGreaterThan(0);
        expect(node.y).toBeGreaterThan(0);
        expect(node.width).toBeGreaterThanOrEqual(140);
        expect(node.height).toBe(44);
    });

    test("assigns layers and routes downward bezier curves for hierarchical calls", () => {
        const graph = {
            nodes: [
                { id: "start:0", type: "start", label: "Start" },
                { id: "action:main", type: "action", label: "main" },
                { id: "action:sub", type: "action", label: "sub" }
            ],
            edges: [
                { source: "start:0", target: "action:main", isRecursive: false },
                { source: "action:main", target: "action:sub", isRecursive: false }
            ]
        };

        const layout = CallGraphLayout.compute(graph);
        expect(layout.positionedNodes).toHaveLength(3);
        const start = layout.positionedNodes.find(n => n.id === "start:0");
        const main = layout.positionedNodes.find(n => n.id === "action:main");
        const sub = layout.positionedNodes.find(n => n.id === "action:sub");

        expect(start.y).toBeLessThan(main.y);
        expect(main.y).toBeLessThan(sub.y);

        expect(layout.routedEdges).toHaveLength(2);
        for (const edge of layout.routedEdges) {
            expect(edge.pathD).toMatch(/^M \d+ \d+ C/);
            expect(edge.markerType).toBe("arrow-normal");
        }
    });

    test("routes self-loops for direct recursion with specialized side curve", () => {
        const graph = {
            nodes: [{ id: "action:loop", type: "action", label: "loop", isRecursive: true }],
            edges: [{ source: "action:loop", target: "action:loop", isRecursive: true }]
        };

        const layout = CallGraphLayout.compute(graph);
        expect(layout.routedEdges).toHaveLength(1);
        const edge = layout.routedEdges[0];
        expect(edge.markerType).toBe("arrow-recursive");
        expect(edge.pathD).toContain("C");
    });

    test("routes upward back-edges with side bypass curves for cyclic calls", () => {
        const graph = {
            nodes: [
                { id: "action:A", type: "action", label: "A", isRecursive: true },
                { id: "action:B", type: "action", label: "B", isRecursive: true }
            ],
            edges: [
                { source: "action:A", target: "action:B", isRecursive: true },
                { source: "action:B", target: "action:A", isRecursive: true }
            ]
        };

        const layout = CallGraphLayout.compute(graph);
        expect(layout.routedEdges).toHaveLength(2);
        const backEdge = layout.routedEdges.find(
            e => e.source === "action:B" && e.target === "action:A"
        );
        expect(backEdge).toBeDefined();
        expect(backEdge.pathD).toMatch(/^M \d+ \d+ C/);
        expect(backEdge.markerType).toBe("arrow-recursive");
    });

    test("routes same-rank calls with arch curve in both directions", () => {
        const graph = {
            nodes: [
                { id: "action:one", type: "action", label: "one", rank: 0 },
                { id: "action:two", type: "action", label: "two", rank: 0 }
            ],
            edges: [
                { source: "action:one", target: "action:two", isRecursive: false },
                { source: "action:two", target: "action:one", isRecursive: false }
            ]
        };

        const layout = CallGraphLayout.compute(graph, { assignRanks: false });
        expect(layout.routedEdges).toHaveLength(2);

        const nodeOne = layout.positionedNodes.find(n => n.id === "action:one");
        const nodeTwo = layout.positionedNodes.find(n => n.id === "action:two");
        expect(nodeOne.y).toBe(nodeTwo.y);
        expect(nodeOne.x).toBeLessThan(nodeTwo.x);

        // Forward arch: one -> two (left to right) starts at right side of one, arches above, lands on left side of two
        const forwardEdge = layout.routedEdges.find(
            e => e.source === "action:one" && e.target === "action:two"
        );
        const expectedSx1 = nodeOne.x + nodeOne.width / 2;
        const expectedTx1 = nodeTwo.x - nodeTwo.width / 2;
        expect(forwardEdge.pathD).toBe(
            `M ${expectedSx1} ${nodeOne.y} C ${expectedSx1} ${nodeOne.y - 32}, ${expectedTx1} ${nodeTwo.y - 32}, ${expectedTx1} ${nodeTwo.y}`
        );

        // Reverse arch: two -> one (right to left) starts at left side of two, arches above, lands on right side of one
        const reverseEdge = layout.routedEdges.find(
            e => e.source === "action:two" && e.target === "action:one"
        );
        const expectedSx2 = nodeTwo.x - nodeTwo.width / 2;
        const expectedTx2 = nodeOne.x + nodeOne.width / 2;
        expect(reverseEdge.pathD).toBe(
            `M ${expectedSx2} ${nodeTwo.y} C ${expectedSx2} ${nodeTwo.y - 32}, ${expectedTx2} ${nodeOne.y - 32}, ${expectedTx2} ${nodeOne.y}`
        );
    });

    test("ignores edges where source or target node is missing from nodeMap", () => {
        const graph = {
            nodes: [{ id: "action:one", type: "action", label: "one" }],
            edges: [
                { source: "action:one", target: "action:missingNode", isRecursive: false },
                { source: "action:nonexistent", target: "action:one", isRecursive: false }
            ]
        };

        const layout = CallGraphLayout.compute(graph);
        expect(layout.routedEdges).toHaveLength(0);
    });

    test("sorts nodes within a rank deterministically by type (start, action, missing, dynamic) then label", () => {
        const graph = {
            nodes: [
                { id: "missing:zoo", type: "missing", label: "zoo", rank: 0 },
                { id: "dynamic:d2", type: "dynamic", label: "dynamicBeta", rank: 0 },
                { id: "action:beta", type: "action", label: "beta", rank: 0 },
                { id: "action:alpha", type: "action", label: "alpha", rank: 0 },
                { id: "start:s1", type: "start", label: "Start", rank: 0 },
                { id: "other:custom", type: "unknown", label: "custom", rank: 0 }
            ],
            edges: []
        };

        const layout = CallGraphLayout.compute(graph, { assignRanks: false });
        const ids = layout.positionedNodes
            .slice()
            .sort((a, b) => a.x - b.x)
            .map(n => n.id);
        expect(ids).toEqual([
            "start:s1",
            "action:alpha",
            "action:beta",
            "missing:zoo",
            "dynamic:d2",
            "other:custom"
        ]);
    });

    test("handles fallback when node rank is undefined in dag traversal", () => {
        const graph = {
            nodes: [{ id: "action:solo", type: "action", label: "solo" }],
            edges: []
        };
        const layout = CallGraphLayout.compute(graph);
        expect(layout.positionedNodes[0].rank).toBe(0);
    });

    test("propagates ranks correctly through multi-path DAG so forward calls flow downward", () => {
        // Start -> A, Start -> B, B -> A, A -> C
        const graph = {
            nodes: [
                { id: "start:0", type: "start", label: "Start" },
                { id: "action:A", type: "action", label: "A" },
                { id: "action:B", type: "action", label: "B" },
                { id: "action:C", type: "action", label: "C" }
            ],
            edges: [
                { source: "start:0", target: "action:A", isRecursive: false },
                { source: "start:0", target: "action:B", isRecursive: false },
                { source: "action:B", target: "action:A", isRecursive: false },
                { source: "action:A", target: "action:C", isRecursive: false }
            ]
        };

        const layout = CallGraphLayout.compute(graph);
        const start = layout.positionedNodes.find(n => n.id === "start:0");
        const b = layout.positionedNodes.find(n => n.id === "action:B");
        const a = layout.positionedNodes.find(n => n.id === "action:A");
        const c = layout.positionedNodes.find(n => n.id === "action:C");

        expect(start.rank).toBe(0);
        expect(b.rank).toBe(1);
        expect(a.rank).toBe(2);
        expect(c.rank).toBe(3);

        expect(start.y).toBeLessThan(b.y);
        expect(b.y).toBeLessThan(a.y);
        expect(a.y).toBeLessThan(c.y);
    });

    test("exercises AMD define branch when define is available", () => {
        const origDefine = global.define;
        let registeredFactory;
        global.define = jest.fn(factory => {
            registeredFactory = factory;
        });
        global.define.amd = true;

        jest.isolateModules(() => {
            require("../CallGraphLayout.js");
        });

        expect(global.define).toHaveBeenCalled();
        if (registeredFactory) {
            const exported = registeredFactory();
            expect(exported.CallGraphLayout).toBeDefined();
        }
        global.define = origDefine;
    });
});
