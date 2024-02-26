/**
 * Provides utility functions for Base64 encoding and decoding.
 * @module base64Utils
 */

/**
 * Encodes a string to Base64 format.
 * @param {string} str - The string to encode.
 * @returns {string} - The Base64 encoded string.
 */
function base64Encode(str) {
    let encoder = new TextEncoder();
    let uint8Array = encoder.encode(str);
    let binaryString = String.fromCharCode(...uint8Array);
    return (binaryString);
}

/**
 * Decodes a Base64 encoded string.
 * @param {string} str - The Base64 encoded string.
 * @returns {string} - The decoded string.
 */
function base64Decode(str) {
    let binaryString = window.atob(str);
    let uint8Array = new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
    let decoder = new TextDecoder();
    return decoder.decode(uint8Array);
}

export default { base64Encode, base64Decode };
