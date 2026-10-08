/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   _, frequencyToPitch
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/musicutils-pitch.js
        frequencyToPitch
*/

/* exported PitchStaircaseSave */

/**
 * @file PitchStaircaseSave.js
 * @description Pitch Staircase saving: turning the stairs into an action stack, with a pitch
 * block for each stair that is a note and a hertz block (initial frequency x the ratio) for each
 * stair between notes.
 *
 * The methods are moved as they were from the PitchStaircase class, which copies them onto
 * PitchStaircase.prototype (see PitchStaircase.installModules), so `this` is still the widget.
 */
class PitchStaircaseSave {
    /**
     * Saves the stairs as a new action stack.
     * @private
     * @returns {void}
     */
    _save() {
        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();
        const newStack = [
            [
                0,
                [
                    "action",
                    {
                        collapsed: true
                    }
                ],
                100,
                100,
                [null, 1, 2, null]
            ],
            [
                1,
                [
                    "text",
                    {
                        value: "stair"
                    }
                ],
                0,
                0,
                [0]
            ]
        ];
        let previousBlock = 0;

        for (let i = 0; i < this.Stairs.length; i++) {
            const frequency = this.Stairs[i][2];
            const pitch = frequencyToPitch(frequency);

            // If cents === 0, then output a pitch block; otherwise,
            // output a hertz block <-- initial frequency x numerator
            // / denominator, followed by two vspace blocks.
            let pitchBlockIdx;
            let hertzBlockIdx;
            let noteIdx;
            let octaveIdx;
            let hiddenIdx;
            let hiddenBlockName;
            let multiplyIdx;
            let frequencyIdx;
            let divideIdx;
            let numeratorIdx;
            let denominatorIdx;
            let vspaceIdx;

            if (pitch[2] === 0) {
                pitchBlockIdx = newStack.length;
                hertzBlockIdx = pitchBlockIdx;
                noteIdx = pitchBlockIdx + 1;
                octaveIdx = pitchBlockIdx + 2;
                hiddenIdx = pitchBlockIdx + 3;
                hiddenBlockName = "hidden";

                newStack.push([
                    hertzBlockIdx,
                    "pitch",
                    0,
                    0,
                    [previousBlock, noteIdx, octaveIdx, hiddenIdx]
                ]);
                newStack.push([
                    noteIdx,
                    [
                        "notename",
                        {
                            value: pitch[0]
                        }
                    ],
                    0,
                    0,
                    [pitchBlockIdx]
                ]);
                newStack.push([
                    octaveIdx,
                    [
                        "number",
                        {
                            value: pitch[1]
                        }
                    ],
                    0,
                    0,
                    [pitchBlockIdx]
                ]);
            } else {
                hertzBlockIdx = newStack.length;
                multiplyIdx = hertzBlockIdx + 1;
                frequencyIdx = hertzBlockIdx + 2;
                divideIdx = hertzBlockIdx + 3;
                numeratorIdx = hertzBlockIdx + 4;
                denominatorIdx = hertzBlockIdx + 5;
                vspaceIdx = hertzBlockIdx + 6;
                hiddenIdx = hertzBlockIdx + 7;
                hiddenBlockName = "vspace";
                newStack.push([
                    hertzBlockIdx,
                    "hertz",
                    0,
                    0,
                    [previousBlock, multiplyIdx, vspaceIdx]
                ]);
                newStack.push([
                    multiplyIdx,
                    "multiply",
                    0,
                    0,
                    [hertzBlockIdx, frequencyIdx, divideIdx]
                ]);
                newStack.push([
                    frequencyIdx,
                    [
                        "number",
                        {
                            value: this.Stairs[i][6].toFixed(2)
                        }
                    ],
                    0,
                    0,
                    [multiplyIdx]
                ]);
                newStack.push([
                    divideIdx,
                    "divide",
                    0,
                    0,
                    [multiplyIdx, numeratorIdx, denominatorIdx]
                ]);
                newStack.push([
                    numeratorIdx,
                    [
                        "number",
                        {
                            value: this.Stairs[i][4]
                        }
                    ],
                    0,
                    0,
                    [divideIdx]
                ]);
                newStack.push([
                    denominatorIdx,
                    [
                        "number",
                        {
                            value: this.Stairs[i][3]
                        }
                    ],
                    0,
                    0,
                    [divideIdx]
                ]);
                newStack.push([vspaceIdx, "vspace", 0, 0, [hertzBlockIdx, hiddenIdx]]);
                // The hidden block will connect here.
                hertzBlockIdx = vspaceIdx;
            }

            if (i === this.Stairs.length - 1) {
                newStack.push([hiddenIdx, hiddenBlockName, 0, 0, [hertzBlockIdx, null]]);
            } else {
                newStack.push([hiddenIdx, hiddenBlockName, 0, 0, [hertzBlockIdx, hiddenIdx + 1]]);
            }

            previousBlock = hiddenIdx;
        }

        this.activity.blocks.loadNewBlocks(newStack);
        this.activity.textMsg(_("New action block generated."), 3000);
    }

    /**
     * Whether Save was pressed in the last second.
     * @private
     * @returns {boolean}
     */
    _get_save_lock() {
        return this._save_lock;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchStaircaseSave;
}
