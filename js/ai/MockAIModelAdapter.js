// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * MockAIModelAdapter.js
 * A basic mock implementation of AIModelAdapter for demonstration and testing.
 */
(function (window) {
    if (typeof window.AIModelAdapter === "undefined") {
        console.warn("AIModelAdapter not found. MockAIModelAdapter may not function correctly.");
    }

    class MockAIModelAdapter extends (window.AIModelAdapter || Object) {
        constructor() {
            super("mock-ai");
        }

        /**
         * Simulates a request to an AI model by returning a dummy response.
         * @param {Object} request - The request payload.
         * @returns {Promise<Object>}
         */
        async request(request) {
            console.log("MockAIModelAdapter: Received request", request);

            // Artificial delay to simulate network/processing time
            await new Promise(resolve => setTimeout(resolve, 500));

            return {
                text: "This is a dummy response from the basic Mock AI Adapter. The design is working!",
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 20
                },
                model: "mock-v1"
            };
        }

        isAvailable() {
            return true;
        }
    }

    // Export to global namespace
    window.MockAIModelAdapter = MockAIModelAdapter;

    // Auto-register if Registry exists
    if (window.AIModelRegistry) {
        window.AIModelRegistry.register(new MockAIModelAdapter());
    }
})(window);
