// Copyright (c) 2014-2024 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* exported
   deepClone, fileBasename, fileExt, hex2rgb, hexToRGB, isSafeUrl, last,
   mixedNumber, nearestBeat, oneHundredToFraction, rationalSum, rgbToHex,
   safeSVG, safeJSONParse, toFixed2, toTitleCase, unescapeHTML, escapeHTML,
   rationalToFraction, GCD, LCD, resolveObject
*/

/**
 * Safely parses a JSON string, wrapping the operation in a try/catch block.
 *
 * @param {string} data - The JSON string to parse
 * @param {*} fallback - The fallback value to return if JSON.parse throws an error.
 * @returns {*} The successfully parsed Object/Array, or the fallback value upon failure.
 */
const safeJSONParse = (data, fallback = null) => {
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
 * @param {Array} myList - The array from which to get the last element.
 * @returns {*} The last element of the array, or null if the array is empty.
 */
const last = myList => {
    const i = myList.length;
    if (i === 0) {
        return null;
    } else {
        return myList[i - 1];
    }
};

/**
 * Creates a deep clone of a value. Uses structuredClone when available,
 * falling back to JSON.parse(JSON.stringify()).
 * @param {*} value - The value to deep clone.
 * @returns {*} A deep clone of the value.
 */
const deepClone = value => {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
};

/**
 * Gets the file extension from a file path.
 * @param {string} file - The file path or name.
 * @returns {string} The file extension.
 */
const fileExt = file => {
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
 * Gets the basename of a file path (excluding the extension).
 * @param {string} file - The file path or name.
 * @returns {string} The basename.
 */
const fileBasename = file => {
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
 * Converts the first character of a string to uppercase.
 * @param {string} str - The input string.
 * @returns {string} The string with the first character in uppercase.
 */
function toTitleCase(str) {
    if (typeof str !== "string") return;
    if (str.length === 0) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string safe for HTML insertion.
 */
function escapeHTML(str) {
    const escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };
    return String(str).replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Reverses HTML entity escaping produced by escapeHTML().
 * @param {string} str - The HTML-escaped string to unescape.
 * @returns {string} The unescaped string with original characters restored.
 */
function unescapeHTML(str) {
    const unescapeMap = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#039;": "'"
    };
    return String(str).replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, match => unescapeMap[match]);
}

/**
 * Validates that a URL string uses a safe protocol (http or https).
 * @param {string} urlString - The URL string to validate.
 * @returns {boolean} True if the URL uses http: or https: protocol.
 */
function isSafeUrl(urlString) {
    try {
        const parsed = new URL(urlString);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (e) {
        return false;
    }
}

/**
 * Escapes HTML entities in a given string to make it safe for SVG.
 * @param {string} label - The string to escape.
 * @returns {string} The escaped string.
 */
function safeSVG(label) {
    if (typeof label === "string") {
        return label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else {
        return label;
    }
}

/**
 * Formats a number to fixed two precision.
 * @param {number} d - The number to format.
 * @returns {string} The formatted number.
 */
function toFixed2(d) {
    if (typeof d === "number") {
        const floor = Math.floor(d);
        if (d !== floor) {
            return d.toFixed(2).toString();
        } else {
            return d.toString();
        }
    } else {
        return d;
    }
}

/**
 * Converts a floating-point number to its approximate fractional representation.
 * @param {number} d - The input number.
 * @returns {Array} An array representing the fraction in the form [numerator, denominator].
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
 * Calculates the greatest common divisor (GCD) of two numbers.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The GCD of the two numbers.
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
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The LCD of the two numbers.
 */
const LCD = (a, b) => {
    return Math.abs((a * b) / GCD(a, b));
};

/**
 * Converts a number to a mixed fraction string.
 * @param {number} d - The input number.
 * @returns {string} The mixed fraction string.
 */
const mixedNumber = d => {
    if (typeof d === "number") {
        const floor = Math.floor(d);
        if (d > floor) {
            const obj = rationalToFraction(d - floor);
            if (floor === 0) {
                return obj[0] + "/" + obj[1];
            } else {
                if (obj[0] === 1 && obj[1] === 1) {
                    return floor + 1;
                } else {
                    if (obj[1] > 99) {
                        return d.toFixed(2);
                    } else {
                        return floor + " " + obj[0] + "/" + obj[1];
                    }
                }
            }
        } else {
            return d.toString() + "/1";
        }
    } else {
        return d;
    }
};

/**
 * Adds two rational numbers represented as arrays [numerator, denominator].
 * @param {Array} a - The first rational number.
 * @param {Array} b - The second rational number.
 * @returns {Array} The sum of the two rational numbers.
 */
const rationalSum = (a, b) => {
    if (
        !Array.isArray(a) ||
        a.length < 2 ||
        !Array.isArray(b) ||
        b.length < 2 ||
        typeof a[0] !== "number" ||
        typeof a[1] !== "number" ||
        typeof b[0] !== "number" ||
        typeof b[1] !== "number" ||
        a[1] === 0 ||
        b[1] === 0
    ) {
        if (typeof console !== "undefined") {
            console.warn("Invalid input passed to rationalSum:", a, b);
        }
        return [0, 1];
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
    return [(a0 * lcd) / a1 + (b0 * lcd) / b1, lcd];
};

/**
 * Finds the nearest beat for a given fraction.
 * @param {number} d - The numerator of the fraction.
 * @param {number} b - The denominator of the fraction.
 * @returns {Array} An array representing the nearest beat.
 */
const nearestBeat = (d, b) => {
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
 * Generates simple fractions based on a scale of 1-100.
 * @param {number} d - The input number.
 * @returns {Array} An array representing the fraction.
 */
const oneHundredToFraction = d => {
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
const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Converts a hexadecimal color code to RGB values.
 */
const hexToRGB = hex => {
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
const hex2rgb = hex => {
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return "rgba(" + r + "," + g + "," + b + ",1)";
};

/**
 * Safely resolves a dot-notation string path to an object property globally.
 */
const resolveObject = path => {
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

// Export for both browser and Node.js environments
const UtilsLogic = {
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
    Object.assign(window, UtilsLogic);
}
