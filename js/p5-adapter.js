/**
 * MusicBlocks v3.4.1
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2025 Music Blocks Contributors
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

/* global define, window */
define(["p5.min"], function (p5) {
    console.log("p5-adapter: p5 loaded");
    if (!window.p5 && p5) {
        window.p5 = p5;
    }
    if (window.Tone) {
        console.log("p5-adapter: Saving OriginalTone");
        window.OriginalTone = window.Tone;
    } else {
        console.warn("p5-adapter: window.Tone not found!");
    }

    // Save original AudioContext constructors to prevent p5.sound from hijacking them
    if (window.AudioContext) {
        window.OriginalAudioContext = window.AudioContext;
    }
    if (window.webkitAudioContext) {
        window.OriginalWebkitAudioContext = window.webkitAudioContext;
    }

    // Save original connect just in case
    if (window.AudioNode && window.AudioNode.prototype) {
        window.OriginalAudioNodeConnect = window.AudioNode.prototype.connect;
    }

    return p5;
});
