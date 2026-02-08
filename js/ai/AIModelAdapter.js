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
 * AIModelAdapter.js
 * Abstract base class for AI Model Adapters.
 * Defines the contract for all AI model integrations.
 */
define([], function () {
    class AIModelAdapter {
        /**
         * Creates an instance of AIModelAdapter.
         * @param {string} name - The identifier for this adapter.
         */
        constructor(name) {
            this.name = name;
        }

        /**
         * Sends a request to the AI model.
         * @param {Object} request - The request payload.
         * @param {string} request.prompt - The input prompt.
         * @param {Object} [request.options] - Configuration for the request.
         * @returns {Promise<Object>} The response from the model.
         */
        async request(request) {
            throw new Error("Method 'request()' must be implemented.");
        }

        /**
         * Checks if the adapter is available and configured.
         * @returns {boolean} True if available.
         */
        isAvailable() {
            return false;
        }
    }

    // Export to global namespace for backward compatibility/console
    window.AIModelAdapter = AIModelAdapter;

    return AIModelAdapter;
});
