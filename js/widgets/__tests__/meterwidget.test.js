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

describe("MeterWidget._setupDefaultStrongWeakBeats logic", () => {
    /**
     * Extracted pure logic from MeterWidget._setupDefaultStrongWeakBeats
     * Returns an array of strong beat indices for given time signature.
     */
    const getDefaultStrongBeats = (numberOfBeats, beatValue) => {
        const strongBeats = [];
        if (beatValue === 0.25 && numberOfBeats === 4) {
            // 4/4 time: beats 1 and 3 are strong
            strongBeats.push(0, 2);
        } else if (beatValue === 0.25 && numberOfBeats === 2) {
            // 2/4 time: beat 1 is strong
            strongBeats.push(0);
        } else if (beatValue === 0.25 && numberOfBeats === 3) {
            // 3/4 time (waltz): beat 1 is strong
            strongBeats.push(0);
        } else if (beatValue === 0.125 && numberOfBeats === 6) {
            // 6/8 time: beats 1 and 4 are strong
            strongBeats.push(0, 3);
        }
        return strongBeats;
    };

    it("should return beats 0 and 2 as strong for 4/4 time signature", () => {
        expect(getDefaultStrongBeats(4, 0.25)).toEqual([0, 2]);
    });

    it("should return beat 0 as strong for 2/4 time signature", () => {
        expect(getDefaultStrongBeats(2, 0.25)).toEqual([0]);
    });

    it("should return beat 0 as strong for 3/4 waltz time signature", () => {
        expect(getDefaultStrongBeats(3, 0.25)).toEqual([0]);
    });

    it("should return beats 0 and 3 as strong for 6/8 time signature", () => {
        expect(getDefaultStrongBeats(6, 0.125)).toEqual([0, 3]);
    });

    it("should return empty array for unrecognized time signature", () => {
        expect(getDefaultStrongBeats(5, 0.25)).toEqual([]);
        expect(getDefaultStrongBeats(7, 0.5)).toEqual([]);
    });
});
