/**
 * MusicBlocks v3.6.2
 *
 * @author Alok Dangre
 *
 * @copyright 2026 Alok Dangre
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

describe("ModeWidget._calculateMode logic", () => {
    /**
     * Extracted pure logic from ModeWidget._calculateMode
     * Converts a 12-element boolean array (representing selected semitones)
     * into an array of intervals (steps between selected notes).
     */
    const calculateMode = selectedNotes => {
        const currentMode = [];
        let j = 1;
        for (let i = 1; i < 12; i++) {
            if (selectedNotes[i]) {
                currentMode.push(j);
                j = 1;
            } else {
                j += 1;
            }
        }
        currentMode.push(j);
        return currentMode;
    };

    it("should return major scale intervals [2,2,1,2,2,2,1] for C major pattern", () => {
        // C major: C(0), D(2), E(4), F(5), G(7), A(9), B(11)
        const selectedNotes = [
            true, // 0: C (root)
            false, // 1: C#
            true, // 2: D
            false, // 3: D#
            true, // 4: E
            true, // 5: F
            false, // 6: F#
            true, // 7: G
            false, // 8: G#
            true, // 9: A
            false, // 10: A#
            true // 11: B
        ];
        expect(calculateMode(selectedNotes)).toEqual([2, 2, 1, 2, 2, 2, 1]);
    });

    it("should return chromatic intervals when all notes selected", () => {
        const selectedNotes = Array(12).fill(true);
        expect(calculateMode(selectedNotes)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    });

    it("should return [12] when only root note is selected", () => {
        const selectedNotes = [
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
        ];
        expect(calculateMode(selectedNotes)).toEqual([12]);
    });
});
