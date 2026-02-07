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
 * AIModelRegistry.js
 * Singleton registry for AI model adapters.
 */
(function (window) {
    class AIModelRegistry {
        constructor() {
            this.adapters = new Map();
            this.activeAdapter = null;
        }

        /**
         * Registers a new adapter.
         * @param {AIModelAdapter} adapter - The adapter to register.
         */
        register(adapter) {
            this.adapters.set(adapter.name, adapter);
            if (!this.activeAdapter) {
                this.activeAdapter = adapter.name;
            }
        }

        /**
         * Sets the active adapter.
         * @param {string} name - Name of the adapter.
         */
        setActiveAdapter(name) {
            if (this.adapters.has(name)) {
                this.activeAdapter = name;
            }
        }

        /**
         * Gets the current active adapter.
         * @returns {AIModelAdapter|null}
         */
        getActive() {
            return this.adapters.get(this.activeAdapter) || null;
        }

        /**
         * Sends a request using the active adapter.
         * @param {Object} request - The request payload.
         * @returns {Promise<Object>}
         */
        async request(request) {
            const adapter = this.getActive();
            if (!adapter) {
                throw new Error("No active AI adapter configured.");
            }
            return adapter.request(request);
        }
    }

    // Export a singleton instance to global namespace
    window.AIModelRegistry = new AIModelRegistry();
})(window);
