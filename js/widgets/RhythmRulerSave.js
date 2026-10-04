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

   _, rationalToFraction, DRUMNAMES, VOICENAMES, EFFECTSNAMES
*/
/*
    Globals location
    - js/utils/utils.js
        _, rationalToFraction
    - js/utils/synthutils.js
        DRUMNAMES, VOICENAMES, EFFECTSNAMES
*/

/* exported RhythmRulerSave */

/**
 * @file RhythmRulerSave.js
 * @description Rhythm Maker saving to blocks: rhythm and tuplet stacks, the drum and voice machines,
 * and merging rulers.
 *
 * The methods are moved as they were from the RhythmRuler class, which copies them onto
 * RhythmRuler.prototype (see RhythmRuler.installModules), so `this` is still the widget.
 */
class RhythmRulerSave {
    /**
     * Saves the current state of the widget.
     * @deprecated This function is deprecated and replaced by the save tuplets code.
     * @private
     * @param {number} selectedRuler - The index of the selected ruler.
     * @returns {void}
     */
    _save(selectedRuler) {
        // Deprecated -- replaced by save tuplets code

        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            // Get the first word of drum's name (ignore the word 'drum' itself)
            // and add 'rhythm'.
            let stack_value;
            if (this.Drums[selectedRuler] === null) {
                stack_value = _("snare drum") + " " + _("rhythm");
            } else {
                stack_value = this._getDrumName(selectedRuler).split(" ")[0] + " " + _("rhythm");
            }
            const delta = selectedRuler * 42;
            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: stack_value }], 0, 0, [0]]
            ];
            let previousBlock = 0;
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];

                    const obj = rationalToFraction(1 / Math.abs(noteValue));

                    newStack.push([
                        idx,
                        "rhythm2",
                        0,
                        0,
                        [previousBlock, idx + 1, idx + 2, idx + 5]
                    ]);
                    newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                    newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                    newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                    newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);
                    newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);
                    if (i === ruler.cells.length - 1) {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                    } else {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, idx + 7]]);
                    }

                    previousBlock = idx + 6;
                    sameNoteValue = 1;
                }
            }

            this.activity.blocks.loadNewBlocks(newStack);
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._save(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * Saves the tuplets for the specified ruler and recursively for the subsequent rulers.
     * @private
     * @param {number} selectedRuler - The index of the selected ruler.
     * @returns {void}
     */
    _saveTuplets(selectedRuler) {
        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            let stack_value;
            if (this.Drums[selectedRuler] === null) {
                stack_value = _("rhythm");
            } else {
                stack_value = this._getDrumName(selectedRuler).split(" ")[0] + " " + _("rhythm");
            }
            const delta = selectedRuler * 42;
            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: stack_value }], 0, 0, [0]]
            ];
            let previousBlock = 0;
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];
                    const obj = rationalToFraction(1 / Math.abs(noteValue));
                    const n = obj[1] / sameNoteValue;
                    if (Number.isInteger(n)) {
                        newStack.push([
                            idx,
                            "stuplet",
                            0,
                            0,
                            [previousBlock, idx + 1, idx + 2, idx + 5]
                        ]);
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                        newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 4, ["number", { value: n }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);
                    } else {
                        newStack.push([
                            idx,
                            "rhythm2",
                            0,
                            0,
                            [previousBlock, idx + 1, idx + 2, idx + 5]
                        ]);
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                        newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);
                        newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);
                    }

                    if (i === ruler.cells.length - 1) {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                    } else {
                        newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, idx + 7]]);
                    }

                    previousBlock = idx + 6;
                    sameNoteValue = 1;
                }
            }

            this.activity.blocks.loadNewBlocks(newStack);
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._saveTuplets(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * Generates and saves a new action block for representing rhythms based on the provided note values.
     * @private
     * @param {number[]} noteValues - An array of note values representing the rhythm.
     * @returns {void}
     */
    _saveTupletsMerged(noteValues) {
        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();

        const stack_value = _("rhythm");
        const delta = 42;
        const newStack = [
            [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
            [1, ["text", { value: stack_value }], 0, 0, [0]]
        ];
        let previousBlock = 0;
        let sameNoteValue = 1;
        for (let i = 0; i < noteValues.length; i++) {
            if (noteValues[i] === noteValues[i + 1] && i < noteValues.length - 1) {
                sameNoteValue += 1;
                continue;
            } else {
                const idx = newStack.length;
                const noteValue = noteValues[i];
                const obj = rationalToFraction(1 / Math.abs(noteValue));
                newStack.push([idx, "rhythm2", 0, 0, [previousBlock, idx + 1, idx + 2, idx + 5]]);
                newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);
                newStack.push([idx + 5, "vspace", 0, 0, [idx, idx + 6]]);

                if (i === noteValues.length - 1) {
                    newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                } else {
                    newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, idx + 7]]);
                }

                previousBlock = idx + 6;
                sameNoteValue = 1;
            }
        }

        this.activity.blocks.loadNewBlocks(newStack);
        activity.textMsg(_("New action block generated."), 3000);
    }

    /**
     * Saves either a drum machine or a voice machine based on the selected ruler.
     * @private
     * @param {number} selectedRuler - The index of the selected ruler.
     * @returns {void}
     */
    _saveMachine(selectedRuler) {
        // We are either saving a drum machine or a voice machine.
        const drum = this._getDrumName(selectedRuler);

        for (let d = 0; d < DRUMNAMES.length; d++) {
            if (DRUMNAMES[d][1] === drum) {
                if (!EFFECTSNAMES.includes(drum)) {
                    this._saveDrumMachine(selectedRuler, drum, false);
                } else {
                    this._saveDrumMachine(selectedRuler, drum, true);
                }

                return;
            }
        }

        for (let d = 0; d < VOICENAMES.length; d++) {
            if (VOICENAMES[d][1] === drum) {
                this._saveVoiceMachine(selectedRuler, drum);
                return;
            }
        }
    }

    /**
     * Saves a drum machine action based on the selected ruler, drum, and effect status.
     * @private
     * @param {number} selectedRuler - The index of the selected ruler.
     * @param {string} drum - The drum instrument name.
     * @param {boolean} effect - Indicates if the drum has an effect applied.
     * @returns {void}
     */
    _saveDrumMachine(selectedRuler, drum, effect) {
        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            const delta = selectedRuler * 42;

            // Just save the action, not the drum machine itself.
            // let newStack = [[0, ['start', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, null]]];
            // newStack.push([1, 'forever', 0, 0, [0, 2, null]]);
            let action_name;
            if (this.Drums[selectedRuler] === null) {
                action_name = _("snare drum") + " " + _("action");
            } else {
                action_name = this._getDrumName(selectedRuler).split(" ")[0] + " " + _("action");
            }

            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: action_name }], 0, 0, [0]]
            ];
            let previousBlock = 0; // 1
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];

                    const obj = rationalToFraction(1 / Math.abs(noteValue));

                    if (sameNoteValue === 1) {
                        // Add a note block.
                        newStack.push([
                            idx,
                            "newnote",
                            0,
                            0,
                            [previousBlock, idx + 1, idx + 4, idx + 7]
                        ]);
                        newStack.push([idx + 1, "divide", 0, 0, [idx, idx + 2, idx + 3]]);
                        newStack.push([idx + 2, ["number", { value: obj[0] }], 0, 0, [idx + 1]]);
                        if (noteValue < 0) {
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, "rest2", 0, 0, [idx + 4, idx + 6]]);
                            newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                        } else {
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, "playdrum", 0, 0, [idx + 4, idx + 6, null]]);
                            if (effect) {
                                newStack.push([
                                    idx + 6,
                                    ["effectsname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 5]
                                ]);
                            } else {
                                newStack.push([
                                    idx + 6,
                                    ["drumname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 5]
                                ]);
                            }
                        }
                        if (i === ruler.cells.length - 1) {
                            newStack.push([idx + 7, "hidden", 0, 0, [idx, null]]);
                        } else {
                            newStack.push([idx + 7, "hidden", 0, 0, [idx, idx + 8]]);
                            previousBlock = idx + 7;
                        }
                    } else {
                        // Add a note block inside a repeat block.
                        if (i === ruler.cells.length - 1) {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, null]
                            ]);
                        } else {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, idx + 10]
                            ]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        newStack.push([idx + 2, "newnote", 0, 0, [idx, idx + 3, idx + 6, idx + 9]]);
                        newStack.push([idx + 3, "divide", 0, 0, [idx + 2, idx + 4, idx + 5]]);
                        newStack.push([idx + 4, ["number", { value: 1 }], 0, 0, [idx + 3]]);
                        if (noteValue < 0) {
                            newStack.push([
                                idx + 5,
                                ["number", { value: -noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, "rest2", 0, 0, [idx + 6, idx + 8]]);
                            newStack.push([idx + 8, "hidden", 0, 0, [idx + 7, null]]);
                        } else {
                            newStack.push([
                                idx + 5,
                                ["number", { value: noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, "playdrum", 0, 0, [idx + 6, idx + 8, null]]);
                            if (effect) {
                                newStack.push([
                                    idx + 8,
                                    ["effectsname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 7]
                                ]);
                            } else {
                                newStack.push([
                                    idx + 8,
                                    ["drumname", { value: drum }],
                                    0,
                                    0,
                                    [idx + 7]
                                ]);
                            }
                        }
                        newStack.push([idx + 9, "hidden", 0, 0, [idx + 2, null]]);
                    }

                    sameNoteValue = 1;
                }
            }

            this.activity.blocks.loadNewBlocks(newStack);
            activity.textMsg(_("New action block generated."), 3000);
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._saveMachine(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * Saves a voice machine action based on the selected ruler and voice.
     * @private
     * @param {number} selectedRuler - The index of the selected ruler.
     * @param {string} voice - The voice instrument name.
     * @returns {void}
     */
    _saveVoiceMachine(selectedRuler, voice) {
        for (const name in this.activity.palettes.dict) {
            this.activity.palettes.dict[name].hideMenu(true);
        }

        this.activity.refreshCanvas();

        setTimeout(() => {
            const ruler = this._rulers[selectedRuler];
            const noteValues = this.Rulers[selectedRuler][0];
            const delta = selectedRuler * 42;

            // Just save the action, not the drum machine itself.
            // let newStack = [[0, ['start', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, null]]];
            // newStack.push([1, 'settimbre', 0, 0, [0, 2, 4, 3]]);
            // newStack.push([2, ['voicename', {'value': voice}], 0, 0, [1]]);
            // newStack.push([3, 'hidden', 0, 0, [1, null]]);
            // newStack.push([4, 'forever', 0, 0, [1, 6, 5]]);
            // newStack.push([5, 'hidden', 0, 0, [4, null]]);

            // This should never happen.
            let action_name;
            if (this.Drums[selectedRuler] === null) {
                action_name = _("guitar") + " " + _("action");
            } else {
                action_name = this._getDrumName(selectedRuler).split(" ")[0] + "_" + _("action");
            }

            const newStack = [
                [0, ["action", { collapsed: true }], 100 + delta, 100 + delta, [null, 1, 2, null]],
                [1, ["text", { value: action_name }], 0, 0, [0]]
            ];
            newStack.push([2, "settimbre", 0, 0, [0, 3, 5, 4]]);
            newStack.push([3, ["voicename", { value: voice }], 0, 0, [2]]);
            newStack.push([4, "hidden", 0, 0, [2, null]]);
            let previousBlock = 2;
            let sameNoteValue = 1;
            for (let i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    const idx = newStack.length;
                    const noteValue = noteValues[i];

                    const obj = rationalToFraction(1 / Math.abs(noteValue));

                    if (sameNoteValue === 1) {
                        // Add a note block.
                        if (noteValue < 0) {
                            newStack.push([
                                idx,
                                "newnote",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 4, idx + 7]
                            ]);
                            newStack.push([idx + 1, "divide", 0, 0, [idx, idx + 2, idx + 3]]);
                            newStack.push([
                                idx + 2,
                                ["number", { value: obj[0] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, "rest2", 0, 0, [idx + 4, idx + 6]]);
                            newStack.push([idx + 6, "hidden", 0, 0, [idx + 5, null]]);
                            if (i === ruler.cells.length - 1) {
                                newStack.push([idx + 7, "hidden", 0, 0, [idx, null]]);
                            } else {
                                newStack.push([idx + 7, "hidden", 0, 0, [idx, idx + 8]]);
                                previousBlock = idx + 7;
                            }
                        } else {
                            newStack.push([
                                idx,
                                "newnote",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 4, idx + 8]
                            ]);
                            newStack.push([idx + 1, "divide", 0, 0, [idx, idx + 2, idx + 3]]);
                            newStack.push([
                                idx + 2,
                                ["number", { value: obj[0] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([
                                idx + 3,
                                ["number", { value: obj[1] }],
                                0,
                                0,
                                [idx + 1]
                            ]);
                            newStack.push([idx + 4, "vspace", 0, 0, [idx, idx + 5]]);
                            newStack.push([
                                idx + 5,
                                "pitch",
                                0,
                                0,
                                [idx + 4, idx + 6, idx + 7, null]
                            ]);
                            newStack.push([idx + 6, ["notename", { value: "C" }], 0, 0, [idx + 5]]);
                            newStack.push([idx + 7, ["number", { value: 4 }], 0, 0, [idx + 5]]);
                            if (i === ruler.cells.length - 1) {
                                newStack.push([idx + 8, "hidden", 0, 0, [idx, null]]);
                            } else {
                                newStack.push([idx + 8, "hidden", 0, 0, [idx, idx + 9]]);
                                previousBlock = idx + 8;
                            }
                        }
                    } else {
                        // Add a note block inside a repeat block.
                        if (i === ruler.cells.length - 1) {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, null]
                            ]);
                        } else {
                            newStack.push([
                                idx,
                                "repeat",
                                0,
                                0,
                                [previousBlock, idx + 1, idx + 2, idx + 11]
                            ]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ["number", { value: sameNoteValue }], 0, 0, [idx]]);
                        if (noteValue < 0) {
                            newStack.push([
                                idx + 2,
                                "newnote",
                                0,
                                0,
                                [idx, idx + 3, idx + 6, idx + 9]
                            ]);
                            newStack.push([idx + 3, "divide", 0, 0, [idx + 2, idx + 4, idx + 5]]);
                            newStack.push([idx + 4, ["number", { value: 1 }], 0, 0, [idx + 3]]);
                            newStack.push([
                                idx + 5,
                                ["number", { value: -noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, "rest2", 0, 0, [idx + 6, idx + 8]]);
                            newStack.push([idx + 8, "hidden", 0, 0, [idx + 7, null]]);
                            newStack.push([idx + 9, "hidden", 0, 0, [idx + 2, null]]);
                        } else {
                            newStack.push([
                                idx + 2,
                                "newnote",
                                0,
                                0,
                                [idx, idx + 3, idx + 6, idx + 10]
                            ]);
                            newStack.push([idx + 3, "divide", 0, 0, [idx + 2, idx + 4, idx + 5]]);
                            newStack.push([idx + 4, ["number", { value: 1 }], 0, 0, [idx + 3]]);
                            newStack.push([
                                idx + 5,
                                ["number", { value: noteValue }],
                                0,
                                0,
                                [idx + 3]
                            ]);
                            newStack.push([idx + 6, "vspace", 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([
                                idx + 7,
                                "pitch",
                                0,
                                0,
                                [idx + 6, idx + 8, idx + 9, null]
                            ]);
                            newStack.push([idx + 8, ["notename", { value: "C" }], 0, 0, [idx + 7]]);
                            newStack.push([idx + 9, ["number", { value: 4 }], 0, 0, [idx + 7]]);
                            newStack.push([idx + 10, "hidden", 0, 0, [idx + 2, null]]);
                        }
                    }

                    sameNoteValue = 1;
                }
            }

            this.activity.blocks.loadNewBlocks(newStack);
            if (selectedRuler > this.Rulers.length - 2) {
                return;
            } else {
                this._saveMachine(selectedRuler + 1);
            }
        }, 500);
    }

    /**
     * Merges the rulers into one set of rhythms.
     * @private
     * @returns {number[]} An array containing the merged rhythm values.
     */
    _mergeRulers() {
        // Merge the rulers into one set of rhythms.
        const rList = [];
        let noteValues;
        for (let r = 0; r < this.Rulers.length; r++) {
            let t = 0;
            const selectedRuler = this.Rulers[r];
            noteValues = selectedRuler[0];
            for (let i = 0; i < noteValues.length; i++) {
                t += 1 / noteValues[i];
                if (!rList.includes(t)) {
                    rList.push(t);
                }
            }
        }

        rList.sort((a, b) => {
            return a - b;
        });

        noteValues = [];
        for (let i = 0; i < rList.length; i++) {
            if (i === 0) {
                noteValues.push(1 / rList[i]);
            } else {
                noteValues.push(1 / (rList[i] - rList[i - 1]));
            }
        }

        return noteValues;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = RhythmRulerSave;
}
