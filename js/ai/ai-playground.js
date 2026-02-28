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
 * ai-playground.js
 * Developer playground for manual testing of AI features.
 * Provides console commands to trigger various AI prototypes safely.
 */
define(["./AIModelRegistry"], function (AIModelRegistry) {
    const Registry = AIModelRegistry || window.AIModelRegistry;
    const AIPlayground = {
        /**
         * Runs a demo of the Melody Suggestion feature.
         */
        testMelodySuggestion: async function () {
            console.log("AI Playground: Testing Melody Suggestion...");
            try {
                const response = await Registry.request({
                    type: "MelodyRequest",
                    prompt: "Suggest melody in C Major"
                });
                console.log("AI Playground: Received Melody Response:", response);
                return response;
            } catch (error) {
                console.error("AI Playground: Melody Suggestion failed:", error);
            }
        },

        /**
         * Runs a demo of the Block Debugging feature.
         */
        testBlockDebugging: async function () {
            console.log("AI Playground: Testing Block Debugging...");
            try {
                const response = await Registry.request({
                    type: "BlockDebugRequest",
                    blockId: "test-block-123"
                });
                console.log("AI Playground: Received Debug Response:", response);
                return response;
            } catch (error) {
                console.error("AI Playground: Block Debugging failed:", error);
            }
        },

        /**
         * Runs all demo tests.
         */
        runAllDemos: async function () {
            console.group("AI Playground: Running All Demos");
            await this.testMelodySuggestion();
            await this.testBlockDebugging();
            console.groupEnd();
        }
    };

    // Export to global namespace
    window.AIPlayground = AIPlayground;

    console.log("AI Playground initialized. Use AIPlayground.runAllDemos() to test.");

    return AIPlayground;
});
