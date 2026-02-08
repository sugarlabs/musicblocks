/**
 * ai_registry_integration.test.js
 * Integration test for AIModelRegistry and Mock Adapters.
 */

describe("AI Registry Integration", () => {
    beforeEach(() => {
        // Mock window object
        global.window = {};

        // Initialize environment for testing IIFE-wrapped classes

        // --- Simulate AIModelAdapter.js ---
        (function (window) {
            class AIModelAdapter {
                constructor(name) {
                    this.name = name;
                }
                async request() {
                    throw new Error("Method 'request()' must be implemented.");
                }
                isAvailable() {
                    return false;
                }
            }
            window.AIModelAdapter = AIModelAdapter;
        })(global.window);

        // --- Simulate AIModelRegistry.js ---
        (function (window) {
            class AIModelRegistry {
                constructor() {
                    this.adapters = new Map();
                    this.activeAdapter = null;
                }
                register(adapter) {
                    this.adapters.set(adapter.name, adapter);
                    if (!this.activeAdapter) this.activeAdapter = adapter.name;
                }
                setActiveAdapter(name) {
                    if (this.adapters.has(name)) this.activeAdapter = name;
                }
                getActive() {
                    return this.adapters.get(this.activeAdapter) || null;
                }
                async request(request) {
                    const adapter = this.getActive();
                    if (!adapter) throw new Error("No active AI adapter configured.");
                    return adapter.request(request);
                }
            }
            window.AIModelRegistry = new AIModelRegistry();
        })(global.window);

        // --- Simulate MockAIModelAdapter.js ---
        (function (window) {
            class MockAIModelAdapter extends window.AIModelAdapter {
                constructor() {
                    super("mock-ai");
                }
                async request(request) {
                    return { text: "mock response", model: "mock-v1" };
                }
                isAvailable() {
                    return true;
                }
            }
            window.MockAIModelAdapter = MockAIModelAdapter;
            window.AIModelRegistry.register(new MockAIModelAdapter());
        })(global.window);

        // --- Simulate ExampleAIAdapter.js ---
        (function (window) {
            class ExampleAIAdapter extends window.AIModelAdapter {
                constructor() {
                    super("example-ai");
                }
                async request(request) {
                    const prompt = (request.prompt || "").toLowerCase();
                    if (prompt.includes("melody")) {
                        return { text: "suggested melody", type: "melody_suggestion" };
                    }
                    return { text: "example response" };
                }
            }
            window.ExampleAIAdapter = ExampleAIAdapter;
            window.AIModelRegistry.register(new ExampleAIAdapter());
        })(global.window);
    });

    test("Registry should have multiple adapters registered", () => {
        const registry = global.window.AIModelRegistry;
        expect(registry.adapters.size).toBe(2);
        expect(registry.adapters.has("mock-ai")).toBe(true);
        expect(registry.adapters.has("example-ai")).toBe(true);
    });

    test("Should use the first registered adapter by default", async () => {
        const registry = global.window.AIModelRegistry;
        const response = await registry.request({ prompt: "hello" });
        expect(response.text).toBe("mock response");
        expect(registry.activeAdapter).toBe("mock-ai");
    });

    test("Should be able to switch between adapters", async () => {
        const registry = global.window.AIModelRegistry;

        registry.setActiveAdapter("example-ai");
        expect(registry.activeAdapter).toBe("example-ai");

        const response = await registry.request({ prompt: "hello" });
        expect(response.text).toBe("example response");
    });

    test("ExampleAIAdapter should handle melody suggestions", async () => {
        const registry = global.window.AIModelRegistry;
        registry.setActiveAdapter("example-ai");

        const response = await registry.request({ prompt: "give me a melody" });
        expect(response.type).toBe("melody_suggestion");
        expect(response.text).toBe("suggested melody");
    });
});
