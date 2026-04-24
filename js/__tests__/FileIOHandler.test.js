/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks contributors
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

const FileIOHandler = require("../FileIOHandler");

describe("FileIOHandler", () => {
    let activity;

    beforeEach(() => {
        document.body.innerHTML = '<div id="canvasHolder"></div>';
        global._ = key => key;

        activity = {
            fileChooser: { addEventListener: jest.fn(), files: [] },
            allFilesChooser: { addEventListener: jest.fn() },
            pluginChooser: { addEventListener: jest.fn(), files: [] }
        };
    });

    afterEach(() => {
        delete global._;
        jest.clearAllMocks();
    });

    test("bind wires chooser and plugin listeners", () => {
        const handler = new FileIOHandler(activity, {
            FileReaderRef: jest.fn()
        });

        handler.bind(jest.fn());

        expect(activity.fileChooser.addEventListener).toHaveBeenCalledTimes(2);
        expect(activity.allFilesChooser.addEventListener).toHaveBeenCalledTimes(1);
        expect(activity.pluginChooser.addEventListener).toHaveBeenCalledTimes(2);
    });
});
