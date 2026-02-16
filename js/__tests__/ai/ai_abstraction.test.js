/**
 * @jest-environment jsdom
 */

// Mock define for Jest environment
global.define = (deps, factory) => {
    const args = (deps || []).map(dep => {
        if (dep.endsWith("AIModelAdapter")) return global.AIModelAdapter;
        if (dep.endsWith("AIModelRegistry")) return global.AIModelRegistry;
        return null;
    });
    return factory(...args);
};

// Load the actual AI abstraction files
require("../../ai/AIModelAdapter.js");
require("../../ai/AIModelRegistry.js");
require("../../ai/MockAIModelAdapter.js");

describe("AI Abstraction Layer End-to-End Mock Tests", () => {
    test("Activity.aiRegistry should be initialized", () => {
        // Mock Activity class
        window.Activity = class {};
        window.Activity.aiRegistry = window.AIModelRegistry;

        expect(window.Activity.aiRegistry).toBeDefined();
        expect(window.AIModelRegistry).toBeDefined();
    });

    test("MockAIModelAdapter should handle MelodyRequest", async () => {
        const request = {
            type: "MelodyRequest",
            prompt: "Suggest melody in C Major"
        };

        const response = await window.AIModelRegistry.request(request);

        expect(response.type).toBe("MelodyResponse");
        expect(response.notes).toEqual(["C4", "E4", "G4", "C5"]);
        expect(response.model).toBe("mock-melody-v1");
    });

    test("MockAIModelAdapter should handle BlockDebugRequest", async () => {
        const request = {
            type: "BlockDebugRequest",
            blockId: "test-block"
        };

        const response = await window.AIModelRegistry.request(request);

        expect(response.type).toBe("BlockDebugResponse");
        expect(response.analysis.status).toBe("ok");
        expect(response.model).toBe("mock-debug-v1");
    });

    test("AIModelRegistry should throw error if no active adapter", async () => {
        const originalActive = window.AIModelRegistry.activeAdapter;
        window.AIModelRegistry.activeAdapter = null;

        await expect(window.AIModelRegistry.request({})).rejects.toThrow(
            "No active AI adapter configured."
        );

        window.AIModelRegistry.activeAdapter = originalActive;
    });
});
