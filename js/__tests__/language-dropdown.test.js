/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks Contributors
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

"use strict";

const fs = require("fs");
const path = require("path");

const readFile = relPath => fs.readFileSync(path.resolve(__dirname, relPath), "utf8");

const getDropdownIds = () => {
    const html = readFile("../../index.html");
    const dropdown = html.match(/<ul[^>]*id="languagedropdown"[^>]*>([\s\S]*?)<\/ul>/);
    expect(dropdown).not.toBeNull();

    return [...dropdown[1].matchAll(/<a\s+id="([^"]+)"/g)].map(match => match[1]);
};

const getToolbarLanguages = () => {
    const source = readFile("../toolbar-ui.js");
    const list = source.match(/renderLanguageSelectIcon[\s\S]*?const languages = \[([\s\S]*?)\]/);
    expect(list).not.toBeNull();

    return [...list[1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
};

describe("language dropdown", () => {
    test("every language in toolbar-ui.js has an entry in index.html", () => {
        const missing = getToolbarLanguages().filter(lang => !getDropdownIds().includes(lang));

        expect(missing).toEqual([]);
    });

    test("every entry in index.html is listed in toolbar-ui.js", () => {
        const languages = getToolbarLanguages();
        const orphaned = getDropdownIds().filter(id => !languages.includes(id));

        expect(orphaned).toEqual([]);
    });

    test("every language has an onclick handler in languagebox.js", () => {
        const source = readFile("../languagebox.js");
        const missing = getToolbarLanguages().filter(lang => !source.includes(`${lang}_onclick(`));

        expect(missing).toEqual([]);
    });
});
