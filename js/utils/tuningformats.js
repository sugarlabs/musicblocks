/**
 * MusicBlocks v3.8.0
 *
 * @author Nirav Sharma
 *
 * @copyright 2026 Walter Bender
 *
 * @license
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

/* exported parseSclFile, parseModeJson, EDO_MIN, EDO_MAX, TuningFormats */

const EDO_MIN = 5;
const EDO_MAX = 55;

const parseSclFile = content => {
    if (typeof content !== "string" || content.trim().length === 0) {
        throw new Error("Invalid .scl file: empty content");
    }

    const lines = content
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    let idx = 0;
    while (idx < lines.length && lines[idx].startsWith("!")) {
        idx++;
    }

    if (idx >= lines.length) {
        throw new Error("Invalid .scl file: no description or pitch count found");
    }

    let description = "";
    let pitchCountIdx = idx;

    if (!/^\d+$/.test(lines[idx])) {
        description = lines[idx];
        pitchCountIdx = idx + 1;
    }

    if (pitchCountIdx >= lines.length) {
        throw new Error("Invalid .scl file: missing pitch count");
    }

    const pitchCount = parseInt(lines[pitchCountIdx], 10);
    if (!/^\d+$/.test(lines[pitchCountIdx]) || pitchCount < 1 || pitchCount > 500) {
        throw new Error("Invalid .scl file: invalid pitch count");
    }
    idx = pitchCountIdx + 1;

    const pitches = [];
    while (idx < lines.length && pitches.length < pitchCount) {
        const line = lines[idx];
        idx++;

        // Per the Scala spec, anything after a valid pitch value is ignored
        // (e.g. " 100.0 C#" or " 5/4   E\").
        const cleaned = line.split(/\s+/)[0].replace(/cents?$/i, "");

        let ratio, cents;
        if (cleaned.includes(".")) {
            if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) {
                throw new Error("Invalid .scl file: invalid cents value: " + cleaned);
            }
            cents = parseFloat(cleaned);
            if (!isFinite(cents)) {
                throw new Error("Invalid .scl file: invalid cents value: " + cleaned);
            }
            ratio = Math.pow(2, cents / 1200);
        } else if (cleaned.includes("/")) {
            const parts = cleaned.split("/");
            if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
                throw new Error("Invalid .scl file: invalid ratio: " + cleaned);
            }
            const num = parseInt(parts[0], 10);
            const den = parseInt(parts[1], 10);
            if (num <= 0 || den <= 0) {
                throw new Error("Invalid .scl file: invalid ratio: " + cleaned);
            }
            ratio = num / den;
            cents = 1200 * Math.log2(ratio);
        } else {
            if (!/^\d+$/.test(cleaned)) {
                throw new Error("Invalid .scl file: invalid pitch value: " + cleaned);
            }
            const val = parseInt(cleaned, 10);
            if (val <= 0) {
                throw new Error("Invalid .scl file: invalid pitch value: " + cleaned);
            }
            ratio = val;
            cents = 1200 * Math.log2(val);
        }

        pitches.push({ ratio, cents });
    }

    for (let j = idx; j < lines.length; j++) {
        if (!lines[j].startsWith("!")) {
            throw new Error("Invalid .scl file: expected " + pitchCount + " pitches, got more");
        }
    }

    if (pitches.length !== pitchCount) {
        throw new Error(
            "Invalid .scl file: expected " + pitchCount + " pitches, got " + pitches.length
        );
    }

    return { description, pitchCount, pitches };
};

const parseModeJson = text => {
    let obj;
    try {
        obj = JSON.parse(text);
    } catch (e) {
        throw new Error("Invalid JSON file: " + e.message);
    }
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        throw new Error("Invalid mode JSON: expected an object");
    }
    const { edo, pattern } = obj;
    if (!Number.isInteger(edo) || edo < EDO_MIN || edo > EDO_MAX) {
        throw new Error("Invalid mode JSON: invalid edo");
    }
    if (
        !Array.isArray(pattern) ||
        pattern.length < 1 ||
        !pattern.every(s => Number.isInteger(s) && s > 0)
    ) {
        throw new Error("Invalid mode JSON: invalid pattern");
    }
    if (pattern.reduce((a, b) => a + b, 0) !== edo) {
        throw new Error("Invalid mode JSON: pattern does not sum to edo");
    }
    return { name: typeof obj.name === "string" ? obj.name : "", edo, pattern };
};

const TuningFormats = {
    parseSclFile,
    parseModeJson,
    EDO_MIN,
    EDO_MAX
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = TuningFormats;
}

if (typeof window !== "undefined") {
    window.TuningFormats = TuningFormats;
}
