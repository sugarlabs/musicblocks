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

const { CallGraphWidget } = require("../CallGraphWidget.js");
const { CallGraphAnalyzer } = require("../CallGraphAnalyzer.js");
const { CallGraphLayout } = require("../CallGraphLayout.js");

global.CallGraphAnalyzer = CallGraphAnalyzer;
global.CallGraphLayout = CallGraphLayout;
global._ = msg => msg;

describe("CallGraphWidget", () => {
    let activity, widgetWin, body;

    beforeEach(() => {
        body = document.createElement("div");

        widgetWin = {
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            addButton: jest.fn().mockImplementation(() => ({ onclick: null })),
            onclose: null,
            onmaximize: null,
            getWidgetBody: jest.fn().mockReturnValue(body)
        };

        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(widgetWin),
            isOpen: jest.fn().mockReturnValue(false)
        };

        activity = {
            blocks: {
                blockList: [
                    { id: 0, name: "start", connections: [null, 1], trash: false },
                    {
                        id: 1,
                        name: "nameddo",
                        privateData: "melody",
                        connections: [0],
                        trash: false
                    },
                    {
                        id: 10,
                        name: "action",
                        connections: [null, 11, 12],
                        trash: false,
                        container: { x: 200, y: 150 }
                    },
                    { id: 11, name: "text", value: "melody", connections: [10], trash: false },
                    { id: 12, name: "forward", connections: [10], trash: false }
                ]
            },
            blocksContainer: { x: 0, y: 0 },
            canvas: { width: 800, height: 600 },
            refreshCanvas: jest.fn(),
            stage: { update: jest.fn() }
        };

        // Add highlight methods to mock blocks
        for (const blk of activity.blocks.blockList) {
            blk.highlight = jest.fn();
            blk.unhighlight = jest.fn();
        }
    });

    test("initializes window, toolbar controls, and renders nodes", () => {
        const widget = new CallGraphWidget(activity);
        expect(widget.isOpen).toBe(true);
        expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(widget, "Code Map", "code map");
        expect(widgetWin.addButton).toHaveBeenCalledTimes(2); // Reload, Fit to view

        // Check header bar and search
        expect(widget.searchInput).toBeDefined();
        expect(widget.summaryBadge).toBeDefined();
        expect(widget.summaryBadge.textContent).toContain("1 Action");
        expect(widget.summaryBadge.textContent).toContain("1 Call");

        // Check SVG nodes
        const nodes = widget.graphRoot.querySelectorAll(".codemap-node");
        expect(nodes.length).toBe(2); // Start + melody
    });

    test("renders empty state message when workspace contains no actions or starts", () => {
        activity.blocks.blockList = [];
        const widget = new CallGraphWidget(activity);
        const emptyText = widget.graphRoot.querySelector(".codemap-empty-text");
        expect(emptyText).not.toBeNull();
        expect(emptyText.textContent).toContain("No action definitions");
    });

    test("displays warning badge in summary when recursion exists", () => {
        // Create direct recursion A -> A
        activity.blocks.blockList = [
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "loop", connections: [10], trash: false },
            { id: 12, name: "nameddo", privateData: "loop", connections: [10], trash: false }
        ];

        const widget = new CallGraphWidget(activity);
        expect(widget.summaryBadge.textContent).toContain("Recursive");
        expect(widget.summaryBadge.className).toContain("codemap-summary-warning");

        const recNode = widget.graphRoot.querySelector(".codemap-node-recursive");
        expect(recNode).not.toBeNull();
    });

    test("filters nodes dynamically by search text", () => {
        activity.blocks.blockList = [
            { id: 10, name: "action", connections: [null, 11, 12], trash: false },
            { id: 11, name: "text", value: "chorus", connections: [10], trash: false },
            { id: 12, name: "forward", connections: [10], trash: false },
            { id: 20, name: "action", connections: [null, 21, 22], trash: false },
            { id: 21, name: "text", value: "verse", connections: [20], trash: false },
            { id: 22, name: "forward", connections: [20], trash: false }
        ];

        const widget = new CallGraphWidget(activity);
        widget.searchInput.value = "chor";
        widget.searchInput.dispatchEvent(new Event("input"));

        const chorusEl = widget.graphRoot.querySelector("[data-node-id='action:chorus']");
        const verseEl = widget.graphRoot.querySelector("[data-node-id='action:verse']");

        expect(chorusEl.classList.contains("codemap-node-dimmed")).toBe(false);
        expect(verseEl.classList.contains("codemap-node-dimmed")).toBe(true);
    });

    test("focuses action block in workspace on node click", () => {
        jest.useFakeTimers();
        const widget = new CallGraphWidget(activity);
        const actionNode = widget.currentLayout.positionedNodes.find(n => n.id === "action:melody");

        const success = widget.focusNode(actionNode);
        expect(success).toBe(true);

        const targetBlock = activity.blocks.blockList.find(b => b.id === 10);
        // Canvas width 800, targetBlock.x 200 -> blocksContainer.x = 400 - 200 = 200
        expect(activity.blocksContainer.x).toBe(200);
        // Canvas height 600, targetBlock.y 150 -> blocksContainer.y = 300 - 150 = 150
        expect(activity.blocksContainer.y).toBe(150);

        expect(targetBlock.highlight).toHaveBeenCalled();
        expect(activity.refreshCanvas).toHaveBeenCalled();

        // Advance timer for unhighlight
        jest.advanceTimersByTime(1500);
        expect(targetBlock.unhighlight).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("triggers node focus on Enter and Space keydown", () => {
        const widget = new CallGraphWidget(activity);
        const nodeEl = widget.graphRoot.querySelector(".codemap-node-action");
        const focusSpy = jest.spyOn(widget, "focusNode");

        nodeEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(focusSpy).toHaveBeenCalledTimes(1);

        nodeEl.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        expect(focusSpy).toHaveBeenCalledTimes(2);
    });

    test("fitToView updates SVG transform based on bounding box", () => {
        const widget = new CallGraphWidget(activity);
        widget.fitToView();
        expect(widget.transform.scale).toBeGreaterThan(0);
        expect(widget.graphRoot.getAttribute("transform")).toContain("scale(");
    });

    test("handles pan and zoom interactions", () => {
        const widget = new CallGraphWidget(activity);
        const initialScale = widget.transform.scale;

        // Zoom via wheel
        widget.viewport.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true }));
        expect(widget.transform.scale).toBeGreaterThan(initialScale);

        // Drag to pan
        widget.svg.dispatchEvent(
            new MouseEvent("mousedown", { clientX: 100, clientY: 100, bubbles: true })
        );
        expect(widget.isPanning).toBe(true);
        expect(widget.svg.style.cursor).toBe("grabbing");

        window.dispatchEvent(
            new MouseEvent("mousemove", { clientX: 150, clientY: 120, bubbles: true })
        );
        window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

        expect(widget.isPanning).toBe(false);
        expect(widget.svg.style.cursor).toBe("grab");
    });

    test("destroy removes listeners and cleans up references", () => {
        const widget = new CallGraphWidget(activity);
        activity.codeMapWidget = widget;

        widget.destroy();
        expect(widget.isOpen).toBe(false);
        expect(widgetWin.destroy).toHaveBeenCalled();
        expect(activity.codeMapWidget).toBeNull();
    });

    test("focusNode handles null, missing block, or trashed block safely", () => {
        const widget = new CallGraphWidget(activity);
        expect(widget.focusNode(null)).toBe(false);
        expect(widget.focusNode({})).toBe(false);
        expect(widget.focusNode({ blockId: 9999 })).toBe(false);

        // Trashed block
        activity.blocks.blockList.push({ id: 50, name: "action", trash: true });
        expect(widget.focusNode({ blockId: 50 })).toBe(false);
    });

    test("triggers fitToView on window maximize", () => {
        jest.useFakeTimers();
        const widget = new CallGraphWidget(activity);
        const fitSpy = jest.spyOn(widget, "fitToView");

        widgetWin.onmaximize();
        jest.advanceTimersByTime(150);
        expect(fitSpy).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("exercises AMD define branch when define is available", () => {
        const origDefine = global.define;
        let registeredFactory;
        global.define = jest.fn(factory => {
            registeredFactory = factory;
        });
        global.define.amd = true;

        jest.isolateModules(() => {
            require("../CallGraphWidget.js");
        });

        expect(global.define).toHaveBeenCalled();
        if (registeredFactory) {
            const exported = registeredFactory();
            expect(exported.CallGraphWidget).toBeDefined();
        }
        global.define = origDefine;
    });
});
