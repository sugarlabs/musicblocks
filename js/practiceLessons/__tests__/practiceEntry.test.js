/**
 * MusicBlocks v3.6.2
 *
 * @author Stuti Jain
 *
 * @copyright 2026 Stuti Jain
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

describe("practiceEntry", () => {
    beforeEach(() => {
        global.PracticeUI = { open: jest.fn() };
        global.ExplorerJournalUI = { open: jest.fn() };

        jest.isolateModules(() => {
            require("../practiceEntry");
        });
    });

    test("exposes the hook the Help menu uses to open the lessons panel", () => {
        window.startPracticeMode();

        expect(global.PracticeUI.open).toHaveBeenCalled();
    });

    test("exposes the hook the Help menu uses to open the Explorer Journal", () => {
        window.openExplorerJournal();

        expect(global.ExplorerJournalUI.open).toHaveBeenCalled();
    });
});
