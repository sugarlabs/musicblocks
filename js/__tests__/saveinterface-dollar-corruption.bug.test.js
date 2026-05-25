/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Music Blocks Contributors
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

// BUG: SaveInterface.prepareHTML() previously passed a string second argument
// to String.prototype.replace, which caused JS to interpret $&, $', $`, and $$
// as special replacement patterns when those characters appeared in user data.
// The fix uses the function form of .replace so dollar-sign patterns are never
// interpreted. These tests exercise the real implementation to guard against
// regressions.
//
// Affected code: js/SaveInterface.js lines 315-319

global._ = jest.fn(str => str);
global.TITLESTRING = "Music Blocks";
global.GUIDEURL = "Docs/guide/guide.html";
global.jQuery = jest.fn(() => ({ on: jest.fn(), trigger: jest.fn() }));
global.jQuery.noConflict = jest.fn(() => global.jQuery);
global.window.jQuery = global.jQuery;
global.docById = jest.fn();
global.docByClass = jest.fn();

const { SaveInterface } = require("../SaveInterface");
const { escapeHTML } = require("../utils/utils");
global.escapeHTML = escapeHTML;

const makeActivity = (name, description, data, image = "") => ({
    PlanetInterface: {
        getCurrentProjectName: jest.fn(() => name),
        getCurrentProjectDescription: jest.fn(() => description),
        getCurrentProjectImage: jest.fn(() => image)
    },
    prepareExport: jest.fn(() => data)
});

describe("SaveInterface.prepareHTML — dollar-sign corruption regression", () => {
    test("$& in project name is preserved literally in HTML output", () => {
        const si = new SaveInterface(makeActivity("Win $& prize", "desc", "[]"));
        const html = si.prepareHTML();
        expect(html).toContain("Win $&amp; prize");
        expect(html).not.toContain("{{ project_name }}");
    });

    test("$& in exported data is preserved literally in HTML output", () => {
        const si = new SaveInterface(makeActivity("My Project", "desc", '{"text":"$&"}'));
        const html = si.prepareHTML();
        // escapeHTML encodes both " → &quot; and & → &amp;
        expect(html).toContain("&quot;$&amp;&quot;");
        expect(html).not.toContain("{{ data }}");
    });

    test("user input 'Win $&!' is preserved exactly (not replaced with placeholder)", () => {
        const si = new SaveInterface(makeActivity("Win $&!", "desc", "[]"));
        const html = si.prepareHTML();
        expect(html).toContain("Win $&amp;!");
        expect(html).not.toContain("{{ project_name }}");
    });

    test("$' (dollar-apostrophe) in data is preserved literally", () => {
        const si = new SaveInterface(makeActivity("My Project", "desc", "price $' end"));
        const html = si.prepareHTML();
        expect(html).toContain("price $&#039; end");
        expect(html).not.toContain("{{ data }}");
    });

    test("$` (dollar-backtick) in data is preserved literally", () => {
        const si = new SaveInterface(makeActivity("My Project", "desc", "val $` end"));
        const html = si.prepareHTML();
        expect(html).toContain("val $` end");
        expect(html).not.toContain("{{ data }}");
    });

    test("$$ in data is preserved literally (not collapsed to single $)", () => {
        const si = new SaveInterface(makeActivity("My Project", "desc", "cost: $$100"));
        const html = si.prepareHTML();
        expect(html).toContain("cost: $$100");
        expect(html).not.toContain("{{ data }}");
    });

    test("all four special patterns in a single data string are all preserved", () => {
        const si = new SaveInterface(makeActivity("My Project", "desc", "a=$& b=$' c=$` d=$$"));
        const html = si.prepareHTML();
        expect(html).toContain("a=$&amp;");
        expect(html).toContain("b=$&#039;");
        expect(html).toContain("c=$`");
        expect(html).toContain("d=$$");
    });
});
