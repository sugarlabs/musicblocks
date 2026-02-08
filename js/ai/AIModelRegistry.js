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
 * Orchestrates multiple adapters and provides a unified interface for requests.
 */
define([], function () {
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
            console.log(`AIModelRegistry: Registering adapter '${adapter.name}'`);
            this.adapters.set(adapter.name, adapter);
            // Default to first registered adapter if none active
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
                console.log(`AIModelRegistry: Active adapter set to '${name}'`);
            } else {
                console.warn(`AIModelRegistry: Adapter '${name}' not found.`);
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
         * Lists all registered adapter names.
         * @returns {string[]}
         */
        getRegisteredAdapters() {
            return Array.from(this.adapters.keys());
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
    const registry = new AIModelRegistry();
    window.AIModelRegistry = registry;

    // Developer helper for console use
    window.setActiveAI = name => window.AIModelRegistry.setActiveAdapter(name);

    return registry;
});
