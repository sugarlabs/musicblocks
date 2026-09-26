/**
 * Fixture: a plain CommonJS module that exposes pure helper functions through a
 * namespace object, in the style used across js/utils/. Exercises parameter and
 * arity detection, branch/return/throw counting, dependency detection and free
 * global references. This file is only ever parsed by the extractor, never run.
 */

const path = require("path");

/**
 * Joins path segments and lower-cases the result.
 *
 * @param {...string} segments - path parts.
 * @returns {string} the normalised path.
 */
function normalizePath(...segments) {
    return path.join(...segments).toLowerCase();
}

/**
 * Clamps a number to a range.
 *
 * @param {number} value - the input value.
 * @param {number} min - lower bound.
 * @param {number} max - upper bound.
 * @returns {number} the clamped value.
 */
const clamp = (value, min = 0, max = 1) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return min;
    }
    if (value < min) return min;
    return value > max ? max : value;
};

/**
 * Parses a boolean-ish string.
 *
 * @param {string} token - the text to parse.
 * @returns {boolean}
 */
function parseFlag(token) {
    switch (String(token).trim().toLowerCase()) {
        case "1":
        case "true":
        case "yes":
            return true;
        default:
            return false;
    }
}

/**
 * Asserts that a value is present.
 *
 * @param {*} value - the value to check.
 * @param {string} label - name used in the error message.
 * @returns {*} the value, when defined.
 */
function required(value, label) {
    if (value === undefined || value === null) {
        throw new Error(`missing required value: ${label}`);
    }
    return value;
}

const SimpleModule = {
    normalizePath,
    clamp,
    parseFlag,
    required
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SimpleModule;
}

if (typeof window !== "undefined") {
    window.SimpleModule = SimpleModule;
}
