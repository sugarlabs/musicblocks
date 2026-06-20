/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Migration Plan:
 * This module is part of a multi-stage refactor to extract pure logic from utils.js.
 * 1. PR 1 (This PR): Introduce utils-logic.js with extracted pure functions.
 * 2. PR 2: Update utils.js to delegate to utils-logic.js and remove redundant code.
 * 3. PR 3: Update browser bootstrap sequence to ensure utils-logic is loaded early.
 */

/* exported
   deepClone, fileBasename, fileExt, hex2rgb, hexToRGB, isSafeUrl, last,
   mixedNumber, nearestBeat, oneHundredToFraction, rationalSum, rgbToHex,
   safeSVG, safeJSONParse, toFixed2, toTitleCase, unescapeHTML, escapeHTML,
   rationalToFraction, GCD, LCD, resolveObject
*/

/**
 * Parses a JSON string with a fallback value.
 * NOTE: This is an environment-aware helper that may log warnings to the console.
 */
var safeJSONParse = (data, fallback = null) => {
    if (typeof data !== "string" || !data) return fallback;
    try {
        return JSON.parse(data);
    } catch (e) {
        if (typeof console !== "undefined") {
            console.warn("Failed to safely parse JSON:", e);
        }
        return fallback;
    }
};

/**
 * Returns the last element of an array.
 */
var last = myList => {
    if (Array.isArray(myList) && myList.length > 0) {
        return myList[myList.length - 1];
    }
    return null;
};

/**
 * Creates a deep clone of an object or array.
 */
var deepClone = obj => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(item => deepClone(item));
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
};

/**
 * Extracts the file extension from a filename or URL.
 */
var fileExt = file => {
    if (file === null) {
        return "";
    }

    const parts = file.split(".");
    if (parts.length === 1 || (parts[0] === "" && parts.length === 2)) {
        return "";
    }

    return parts.pop();
};

/**
 * Extracts the base name (filename without extension) from a filename or URL.
 */
var fileBasename = file => {
    if (file === null) {
        return "";
    }

    const parts = file.split(".");
    if (parts.length === 1) {
        return parts[0];
    } else if (parts[0] === "" && parts.length === 2) {
        return file;
    } else {
        parts.pop(); // throw away suffix
        return parts.join(".");
    }
};

/**
 * Converts a string to Title Case.
 */
var toTitleCase = str => {
    if (typeof str !== "string") return undefined;
    if (str.length === 0) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Escapes special characters in a string for use in HTML.
 */
var escapeHTML = str => {
    const escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };
    return String(str).replace(/[&<>"']/g, char => escapeMap[char]);
};

/**
 * Unescapes HTML entities in a string.
 */
var unescapeHTML = str => {
    const unescapeMap = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#039;": "'"
    };
    return String(str).replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, match => unescapeMap[match]);
};

/**
 * Checks if a URL is considered safe.
 * Decodes HTML entities and handles common bypass attempts.
 */
var isSafeUrl = urlString => {
    if (!urlString || typeof urlString !== "string") return false;

    try {
        // Step 1: Normalize and trim
        let decodedUrl = urlString.trim();

        // Step 2: Decode HTML entities if in a browser environment
        // This catches bypasses like &#106;avascript:
        if (typeof document !== "undefined" && typeof DOMParser !== "undefined") {
            const parser = new DOMParser();
            const doc = parser.parseFromString(decodedUrl, "text/html");
            decodedUrl = (doc.body.textContent || "").trim();
        } else {
            // Basic fallback for non-browser environments (like Jest without full DOM)
            // if unescapeHTML is available in the same scope
            if (typeof unescapeHTML === "function") {
                decodedUrl = unescapeHTML(decodedUrl).trim();
            }
        }

        // Step 3: Remove non-printable characters and whitespace that might be used for bypasses
        // e.g., "java\tscript:"
        // eslint-disable-next-line no-control-regex
        decodedUrl = decodedUrl.replace(/[\u0000-\u0020\u007F]/g, "");

        // Step 4: Parse the URL
        // We do NOT use a base URL here to ensure we only allow absolute URLs.
        // Relative URLs will throw and return false, which is the safer default.
        const parsed = new URL(decodedUrl);

        // Step 5: Allow only specific safe protocols
        const safeProtocols = ["http:", "https:"];
        return safeProtocols.includes(parsed.protocol);
    } catch (e) {
        return false;
    }
};

/**
 * Escapes characters in a string to make it safe for use in an SVG.
 */
var safeSVG = text => {
    if (typeof text !== "string") return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

/**
 * Formats a number to at most two decimal places.
 * NOTE: This function removes trailing zeros (e.g., 3.10 becomes 3.1).
 */
var toFixed2 = n => {
    if (typeof n !== "number") return n;
    const s = n.toString();
    const decimalIndex = s.indexOf(".");
    if (decimalIndex === -1) return s;
    return n.toFixed(2).replace(/\.?0+$/, "");
};

/**
 * Calculates the greatest common divisor (GCD) of two numbers.
 */
function GCD(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        const n = b;
        b = a % b;
        a = n;
    }
    return a;
}

/**
 * Calculates the least common denominator (LCD) of two numbers.
 */
var LCD = (a, b) => {
    return Math.abs((a * b) / GCD(a, b));
};

/**
 * Convert float to its approximate fractional representation.
 */
function rationalToFraction(d) {
    if (d === 0 || isNaN(d) || !isFinite(d)) {
        return [0, 1];
    }

    let invert;
    if (d > 1) {
        invert = true;
        d = 1 / d;
    } else {
        invert = false;
    }

    let df = 1.0;
    let top = 1;
    let iterations = 0;
    const maxIterations = 10000;
    let bot = 1;

    while (Math.abs(df - d) > 0.00000001 && iterations < maxIterations) {
        if (df < d) {
            top += 1;
        } else {
            bot += 1;
            top = Math.round(d * bot);
        }

        df = top / bot;
        iterations++;
    }

    if (iterations === maxIterations) {
        return [top, bot];
    }

    if (bot === 0 || top === 0) {
        return [0, 1];
    }

    if (invert) {
        return [bot, top];
    } else {
        return [top, bot];
    }
}

/**
 * Converts a number to a mixed fraction string.
 */
var mixedNumber = d => {
    if (typeof d === "number") {
        const floor = Math.floor(d);
        if (d > floor) {
            const obj = rationalToFraction(d - floor);
            if (floor === 0) {
                return obj[0] + "/" + obj[1];
            } else {
                if (obj[0] === 1 && obj[1] === 1) {
                    return (floor + 1).toString();
                } else {
                    if (obj[1] > 99) {
                        return d.toFixed(2);
                    } else {
                        return floor + " " + obj[0] + "/" + obj[1];
                    }
                }
            }
        } else if (floor === d) {
            return d.toString() + "/1";
        }
    } else {
        return d;
    }
};

/**
 * Adds two rational numbers [numerator, denominator].
 * NOTE: The result is NOT normalized/simplified (e.g., [1,2] + [1,2] returns [2,2]).
 * This preserves original musical division context where explicit denominators matter.
 */
var rationalSum = (a, b) => {
    // Rejects non-array, wrong-length, or non-number inputs.
    // A zero numerator ([0, n]) is valid and passes through — only the
    // denominator (index 1) must be non-zero.
    if (
        !Array.isArray(a) ||
        a.length < 2 ||
        !Array.isArray(b) ||
        b.length < 2 ||
        typeof a[0] !== "number" ||
        typeof a[1] !== "number" ||
        typeof b[0] !== "number" ||
        typeof b[1] !== "number"
    ) {
        if (typeof console !== "undefined") {
            console.warn("Invalid input passed to rationalSum:", a, b);
        }
        return [[0, 1], "Invalid input passed to rationalSum"];
    }

    if (a[1] === 0 || b[1] === 0) {
        if (typeof console !== "undefined") {
            console.error("rationalSum: zero denominator — corrupted rhythm state", { a, b });
        }
        return [[0, 1], "Note calculation failed: zero denominator"];
    }

    let obja0, objb0, obja1, objb1;
    if (Math.floor(a[0]) !== a[0]) {
        obja0 = rationalToFraction(a[0]);
    } else {
        obja0 = [a[0], 1];
    }

    if (Math.floor(b[0]) !== b[0]) {
        objb0 = rationalToFraction(b[0]);
    } else {
        objb0 = [b[0], 1];
    }

    if (Math.floor(a[1]) !== a[1]) {
        obja1 = rationalToFraction(a[1]);
    } else {
        obja1 = [a[1], 1];
    }

    if (Math.floor(b[1]) !== b[1]) {
        objb1 = rationalToFraction(b[1]);
    } else {
        objb1 = [b[1], 1];
    }
    const a0 = obja0[0] * obja1[1];
    const a1 = obja0[1] * obja1[0];
    const b0 = objb0[0] * objb1[1];
    const b1 = objb0[1] * objb1[0];

    const lcd = LCD(a1, b1);
    return [[(a0 * lcd) / a1 + (b0 * lcd) / b1, lcd], null];
};

/**
 * Finds the nearest beat for a given fraction.
 */
var nearestBeat = (d, b) => {
    let sum = 1 / (2 * b);
    let count = 0;
    const dd = d / 100;
    while (dd > sum) {
        sum += 1 / b;
        count += 1;
    }
    return [count, b];
};

/**
 * Converts a value (0-100) to a musical fraction representation.
 */
var oneHundredToFraction = d => {
    // Generate some simple fractions based on a scale of 1-100

    if (d < 1) {
        return [1, 64];
    } else if (d > 99) {
        return [1, 1];
    }

    switch (Math.floor(d)) {
        case 1:
            return [1, 64];
        case 2:
            return [1, 48];
        case 3:
        case 4:
        case 5:
            return [1, 32];
        case 6:
        case 7:
        case 8:
            return [1, 16];
        case 9:
        case 10:
        case 11:
            return [1, 12];
        case 12:
        case 13:
        case 14:
            return [1, 8];
        case 15:
        case 16:
        case 17:
            return [1, 6];
        case 18:
        case 19:
            return [3, 16];
        case 20:
        case 21:
        case 22:
            return [1, 5];
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
            return [1, 4];
        case 30:
        case 31:
            return [5, 16];
        case 32:
        case 33:
        case 34:
        case 35:
            return [1, 3];
        case 36:
        case 37:
        case 38:
        case 39:
            return [3, 8];
        case 40:
        case 41:
            return [2, 5];
        case 42:
        case 43:
        case 44:
            return [7, 16];
        case 45:
        case 46:
        case 47:
            return [15, 32];
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
            return [1, 2];
        case 53:
        case 54:
            return [17, 32];
        case 56:
        case 57:
        case 58:
            return [9, 16];
        case 59:
        case 60:
        case 61:
            return [3, 5];
        case 62:
        case 63:
        case 64:
        case 65:
            return [5, 8];
        case 66:
        case 67:
            return [2, 3];
        case 68:
        case 69:
        case 70:
            return [11, 16];
        case 71:
        case 72:
        case 73:
        case 74:
            return [23, 32];
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
            return [3, 4];
        case 81:
        case 82:
            return [13, 16];
        case 83:
        case 84:
        case 85:
        case 86:
            return [5, 6];
        case 87:
        case 88:
        case 89:
        case 90:
            return [7, 8];
        case 91:
        case 92:
            return [11, 12];
        case 93:
        case 94:
        case 95:
            return [15, 16];
        case 96:
        case 98:
            return [31, 32];
        case 99:
            return [63, 64];
        default:
            return [d, 100];
    }
};

/**
 * Converts RGB values to a hexadecimal color code.
 */
var rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Converts a hexadecimal color code to RGB values.
 */
var hexToRGB = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          }
        : null;
};

/**
 * Converts a hexcode to RGBA format.
 */
var hex2rgb = hex => {
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return "rgba(" + r + "," + g + "," + b + ",1)";
};

/**
 * Environment-dependent helpers
 */

/**
 * Resolves a dot-notation string path globally.
 * NOTE: This depends on window/global context.
 */
var resolveObject = path => {
    if (!path || typeof path !== "string") return undefined;

    const globalObj = typeof window !== "undefined" ? window : global;

    try {
        const result = path.split(".").reduce((obj, prop) => {
            if (obj === null || obj === undefined) {
                return undefined;
            }
            return obj[prop];
        }, globalObj);

        return result;
    } catch (e) {
        if (typeof console !== "undefined") {
            console.warn("Failed to resolve object path: " + path, e);
        }
        return undefined;
    }
};

/**
 * Module/Global Export logic
 */
var UtilsLogic = {
    safeJSONParse,
    last,
    deepClone,
    fileExt,
    fileBasename,
    toTitleCase,
    escapeHTML,
    unescapeHTML,
    isSafeUrl,
    safeSVG,
    toFixed2,
    rationalToFraction,
    GCD,
    LCD,
    mixedNumber,
    rationalSum,
    nearestBeat,
    oneHundredToFraction,
    rgbToHex,
    hexToRGB,
    hex2rgb,
    resolveObject
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = UtilsLogic;
}

if (typeof window !== "undefined") {
    window.UtilsLogic = UtilsLogic;
    Object.assign(window, UtilsLogic);
}
