/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 Mohit Verma
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
    return btoa(binaryString); // Proper Base64 encoding
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { base64Encode, base64Decode };
}