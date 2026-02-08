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
 * ExampleAIAdapter.js
 * A more advanced mock implementation that simulates specific AI behaviors
 * such as melody suggestions and block debugging.
 */
(function (window) {
    if (typeof window.AIModelAdapter === "undefined") {
        console.warn("AIModelAdapter not found. ExampleAIAdapter may not function correctly.");
    }

    class ExampleAIAdapter extends (window.AIModelAdapter || Object) {
        constructor() {
            super("example-ai");
        }

        /**
         * Simulates different AI behaviors based on the prompt content.
         * @param {Object} request - The request payload.
         * @returns {Promise<Object>}
         */
        async request(request) {
            console.log("ExampleAIAdapter: Processing request", request);
            const prompt = (request.prompt || "").toLowerCase();

            // Artificial delay
            await new Promise(resolve => setTimeout(resolve, 800));

            if (prompt.includes("melody") || prompt.includes("suggest")) {
                return {
                    text: "Suggested melody: [C4, E4, G4, C5] (C Major arpeggio).",
                    type: "melody_suggestion",
                    data: ["C4", "E4", "G4", "C5"],
                    model: "example-v1"
                };
            }

            if (prompt.includes("debug") || prompt.includes("fix") || prompt.includes("error")) {
                return {
                    text: "Potential issue: Missing repeat count value in block hierarchy.",
                    type: "debug_advice",
                    advice: "Ensure all repeat blocks have a numerical value attached.",
                    model: "example-v1"
                };
            }

            return {
                text: "Example adapter response. Try 'melody' or 'debug' prompts.",
                usage: {
                    prompt_tokens: 15,
                    completion_tokens: 25
                },
                model: "example-v1"
            };
        }

        isAvailable() {
            return true;
        }
    }

    // Export to global namespace
    window.ExampleAIAdapter = ExampleAIAdapter;

    // Auto-register if Registry exists
    if (window.AIModelRegistry) {
        window.AIModelRegistry.register(new ExampleAIAdapter());
    }
})(window);
