/**
 * MusicBlocks v3.7.1
 *
 * @copyright 2026 Kunal Kumar
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/*
 * `ast2blocks.json` is the source of truth for the AST-to-block mappings, but
 * it is not what runs. The JS editor loads `ast2blocks.config.js`
 * (js/loader.js:230, js/widgets/jseditor.js:998), and `ast2blocks.min.json`
 * is a third copy.
 *
 * Nothing currently checks that the three agree. `minify.test.js` mocks `fs`
 * and only asserts that minify.js calls readFileSync/writeFileSync with the
 * right arguments, and `ast2blocklist.test.js` reads `ast2blocks.json`
 * directly. So a mapping added to the JSON alone passes every test while the
 * editor keeps using the old table.
 *
 * These tests compare the parsed values rather than the file text, because
 * `ast2blocks.config.js` is pretty-printed by hand and is deliberately not
 * byte-identical to minify.js's output.
 */

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..");
const readJSON = name => JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8"));

/** Evaluate ast2blocks.config.js the way a browser would and hand back the object. */
const loadConfigJS = () => {
    const text = fs.readFileSync(path.join(DIR, "ast2blocks.config.js"), "utf8");
    const sandbox = {};
    new Function("window", text)(sandbox);
    return sandbox.ast2blocklist_config;
};

/** Every leaf path where two objects disagree, so a failure names the mapping. */
const diffPaths = (a, b, prefix = "") => {
    const out = [];
    const isObj = v => typeof v === "object" && v !== null;
    if (!isObj(a) || !isObj(b)) {
        if (JSON.stringify(a) !== JSON.stringify(b)) {
            out.push(`${prefix || "<root>"}: json=${JSON.stringify(a)} other=${JSON.stringify(b)}`);
        }
        return out;
    }
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        out.push(...diffPaths(a[key], b[key], prefix ? `${prefix}.${key}` : key));
    }
    return out;
};

describe("ast2blocks config copies stay in sync", () => {
    const source = readJSON("ast2blocks.json");

    test("ast2blocks.config.js holds the same mappings as ast2blocks.json", () => {
        const config = loadConfigJS();
        expect(config).toBeDefined();
        expect(diffPaths(source, config)).toEqual([]);
    });

    test("ast2blocks.min.json holds the same mappings as ast2blocks.json", () => {
        expect(diffPaths(source, readJSON("ast2blocks.min.json"))).toEqual([]);
    });

    test("ast2blocks.min.json is exactly what minify.js would write", () => {
        // This one may be byte-compared: minify.js writes JSON.stringify output
        // and nothing hand-edits the .min.json.
        const expected = JSON.stringify(source);
        const actual = fs.readFileSync(path.join(DIR, "ast2blocks.min.json"), "utf8").trim();
        expect(actual).toBe(expected);
    });

    test("every name in the getter tables maps to a non-empty block name", () => {
        const bad = [];
        const walk = (node, trail) => {
            if (Array.isArray(node)) {
                node.forEach((v, i) => walk(v, `${trail}[${i}]`));
            } else if (node && typeof node === "object") {
                for (const [k, v] of Object.entries(node)) {
                    if (typeof v === "string") {
                        if (/^[A-Z][A-Z0-9_]*$/.test(k) && v.trim() === "") {
                            bad.push(`${trail}.${k}`);
                        }
                    } else {
                        walk(v, `${trail}.${k}`);
                    }
                }
            }
        };
        walk(source, "");
        expect(bad).toEqual([]);
    });
});
