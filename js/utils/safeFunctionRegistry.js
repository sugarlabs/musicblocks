// Copyright (c) 2025 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
    Safe Function Registry

    Plugins must never execute arbitrary JS strings.
    Instead, plugin JSON should reference a handler name that is resolved
    from this allow-listed registry.

    This file supports both RequireJS (AMD) and plain script inclusion.
*/

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        factory();
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const root = typeof globalThis !== "undefined" ? globalThis : this;

    if (!root.SAFE_FUNCTIONS) {
        root.SAFE_FUNCTIONS = Object.create(null);
    }

    if (typeof root.registerSafeFunction !== "function") {
        root.registerSafeFunction = function registerSafeFunction(name, fn) {
            if (typeof name !== "string" || name.length === 0) {
                throw new Error("registerSafeFunction: name must be a non-empty string");
            }
            if (typeof fn !== "function") {
                throw new Error("registerSafeFunction: fn must be a function");
            }
            root.SAFE_FUNCTIONS[name] = fn;
        };
    }

    return {
        SAFE_FUNCTIONS: root.SAFE_FUNCTIONS,
        registerSafeFunction: root.registerSafeFunction
    };
});
