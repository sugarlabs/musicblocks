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
define(["./AIModelAdapter", "./AIModelRegistry"], function (AIModelAdapter, AIModelRegistry) {
    const Registry = AIModelRegistry || window.AIModelRegistry;
    class ExampleAIAdapter extends (AIModelAdapter || window.AIModelAdapter) {
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
                    text: "Here is a suggested melody: [C4, E4, G4, C5]. This is a simple C Major arpeggio that works well as a starter.",
                    type: "melody_suggestion",
                    data: ["C4", "E4", "G4", "C5"],
                    model: "example-v1"
                };
            }

            if (prompt.includes("debug") || prompt.includes("fix") || prompt.includes("error")) {
                return {
                    text: "I analyzed your blocks. It seems you have a 'repeat' block without a count value. Setting the count to 4 should fix the 'infinite loop' Warning.",
                    type: "debug_advice",
                    advice: "Ensure all repeat blocks have a numerical value attached.",
                    model: "example-v1"
                };
            }

            return {
                text: "ExampleAIAdapter received your request. I can help with melody suggestions or block debugging! Try asking for a melody.",
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

    // Auto-register
    if (Registry) {
        Registry.register(new ExampleAIAdapter());
    }

    return ExampleAIAdapter;
});
