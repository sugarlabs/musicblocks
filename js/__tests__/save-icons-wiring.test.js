/**
 * @license
 * MusicBlocks v3.7.1
 * Copyright (C) 2026 Rakshit Yadav
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

// Toolbar.renderSaveIcons() takes its handlers positionally, so a call site
// that passes the wrong number of arguments silently shifts every handler
// after the extra one onto the wrong menu item. That is invisible to a unit
// test that mocks the call site, so the arity is checked against the source.

const fs = require("fs");
const path = require("path");

const read = rel => fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf8");

/** Names of the parameters renderSaveIcons() declares, in order. */
const declaredParams = source => {
    const start = source.indexOf("renderSaveIcons(");
    expect(start).toBeGreaterThan(-1);
    const open = source.indexOf("(", start);
    const close = source.indexOf(")", open);
    return source
        .slice(open + 1, close)
        .split(",")
        .map(p => p.trim())
        .filter(Boolean);
};

/** Every renderSaveIcons(...) call in `source`, as arrays of argument text. */
const callArguments = source => {
    const calls = [];
    const re = /renderSaveIcons\(/g;
    let m;
    while ((m = re.exec(source)) !== null) {
        const open = m.index + m[0].length - 1;
        // A declaration, not a call: its body follows the closing paren.
        let depth = 0;
        let end = -1;
        for (let i = open; i < source.length; i++) {
            if (source[i] === "(") depth += 1;
            else if (source[i] === ")") {
                depth -= 1;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }
        if (end === -1) continue;
        if (/^\s*\{/.test(source.slice(end + 1))) continue;

        const inner = source.slice(open + 1, end);
        const args = [];
        let buf = "";
        let d = 0;
        for (const ch of inner) {
            if (ch === "(" || ch === "[" || ch === "{") d += 1;
            if (ch === ")" || ch === "]" || ch === "}") d -= 1;
            if (ch === "," && d === 0) {
                args.push(buf.trim());
                buf = "";
            } else {
                buf += ch;
            }
        }
        if (buf.trim()) args.push(buf.trim());
        calls.push({ line: source.slice(0, m.index).split("\n").length, args });
    }
    return calls;
};

describe("renderSaveIcons call sites", () => {
    const toolbarSource = read("js/toolbar-ui.js");
    const params = declaredParams(toolbarSource);

    it("declares the handlers the save menu needs", () => {
        expect(params).toEqual([
            "html_onclick",
            "doSVG_onclick",
            "svg_onclick",
            "midi_onclick",
            "png_onclick",
            "wave_onclick",
            "ly_onclick",
            "abc_onclick",
            "mxml_onclick",
            "blockartworksvg_onclick",
            "blockartworkpng_onclick"
        ]);
    });

    it.each(["js/activity.js", "js/toolbar-ui.js"])(
        "%s passes one argument per declared parameter",
        file => {
            const calls = callArguments(read(file));
            expect(calls.length).toBeGreaterThan(0);
            for (const call of calls) {
                expect({ file, line: call.line, count: call.args.length }).toEqual({
                    file,
                    line: call.line,
                    count: params.length
                });
            }
        }
    );

    it("passes the block artwork handlers last at every call site", () => {
        for (const file of ["js/activity.js", "js/toolbar-ui.js"]) {
            for (const call of callArguments(read(file))) {
                expect(
                    `${file}:${call.line} -> ${call.args[params.indexOf("abc_onclick")]}`
                ).toMatch(/saveAbc/);
                expect(
                    `${file}:${call.line} -> ${call.args[params.indexOf("mxml_onclick")]}`
                ).toMatch(/saveMxml/);
                expect(
                    `${file}:${call.line} -> ${call.args[params.indexOf("blockartworksvg_onclick")]}`
                ).toMatch(/saveBlockArtwork\b/);
                expect(
                    `${file}:${call.line} -> ${call.args[params.indexOf("blockartworkpng_onclick")]}`
                ).toMatch(/saveBlockArtworkPNG/);
            }
        }
    });
});
