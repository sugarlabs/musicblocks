/**
 * Planet Utilities - Global Polyfill
 * This file provides global functions required by GlobalTag.js
 * specifically for environments using RequireJS/AMD loaders.
 */

// Immediately attach functions to window object
(function() {
    // 1. Fix for 'toTitleCase is not defined'
    window.toTitleCase = function(str) {
        if (!str || typeof str !== 'string') return "";
        return str.toLowerCase().replace(/\b\w/g, function(s) {
            return s.toUpperCase();
        });
    };

    // 2. Fix for '_ is not defined' (Translation Helper)
    // Only defines it if it doesn't already exist to avoid overwriting real translation engines
    if (!window._) {
        window._ = function(text) {
            return text || "";
        };
    }

    console.log("Planet Utilities: toTitleCase and _ have been globally initialized.");
})();