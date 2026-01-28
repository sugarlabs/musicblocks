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
