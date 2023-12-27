// Copyright (c) 2019 Bottersnike
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, last, FlowBlock, NOINPUTERRORMSG, TONEBPM, Singer,
   FlowClampBlock, DEFAULTDRUM, _THIS_IS_MUSIC_BLOCKS_,
   _THIS_IS_TURTLE_BLOCKS_ 
 */

/* exported setupRhythmBlockPaletteBlocks */

const language = localStorage.languagePreference || navigator.language;
let rhythmBlockPalette = language === "ja" ? "rhythm" : "widgets";
if (_THIS_IS_TURTLE_BLOCKS_) {
    rhythmBlockPalette = "rhythm";
}

function setupRhythmBlockPaletteBlocks(activity) {
    /**
     * Represents a block for handling rhythms.
     * @extends {FlowBlock}
     */
    class RhythmBlock extends FlowBlock {
        /**
         * Constructs a RhythmBlock.
         * @param {string} name - The name of the block.
         */
        constructor(name) {
            super(name || "rhythm");
            this.setPalette(rhythmBlockPalette, activity);
            this.setHelpString();
            this.formBlock({
                /**
                 * @type {string}
                 * @description Block name.
                 */
                name:
                    this.lang === "ja"
                        ? //.TRANS: rhythm block
                          _("rhythm1")
                        : //.TRANS: an arrangement of notes based on duration
                          _("rhythm"),

                /**
                 * @type {number}
                 * @description Number of arguments.
                 */
                args: 2,

                /**
                 * @type {Array}
                 * @description Default values for arguments.
                 */
                defaults: [3, 4],

                /**
                 * @type {Array}
                 * @description Argument labels.
                 */
                argLabels: [_("number of notes"), _("note value")],

                /**
                 * @type {Array}
                 * @description Argument types.
                 */
                argTypes: ["anyin", "anyin"]
            });
            this.hidden = this.deprecated = true;
        }

        /**
         * Handles the flow of the block.
         *
         * @param {Array} args - Arguments for the block.
         * @param {object} logo - Logo object.
         * @param {string} turtle - Turtle identifier.
         * @param {string} blk - Block identifier.
         * @returns {Array} - Array containing the result of the flow.
         */
        flow(args, logo, turtle, blk) {
            let noteBeatValue, arg0, arg1;
            if (args[0] === null || typeof args[0] !== "number" || args[0] < 1) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = 3;
            } else {
                arg0 = args[0];
            }

            if (args[1] === null || typeof args[1] !== "number" || args[1] <= 0) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 1 / 4;
            } else {
                arg1 = args[1];
            }

            if (activity.blocks.blockList[blk].name === "rhythm2") {
                noteBeatValue = 1 / arg1;
            } else {
                noteBeatValue = arg1;
            }

            if (logo.inMatrix || logo.tuplet) {
                if (logo.inMatrix) {
                    logo.phraseMaker.addColBlock(blk, arg0);
                }

                for (let i = 0; i < args[0]; i++) {
                    Singer.processNote(activity, noteBeatValue, false, blk, turtle);
                }
            } else if (logo.inRhythmRuler) {
                // We don't check for balance since we want to support
                // polyphonic rhythms.
                if (logo.rhythmRulerMeasure === null) {
                    logo.rhythmRulerMeasure = arg0 * arg1;
                } else if (logo.rhythmRulerMeasure != arg0 * arg1) {
                    activity.textMsg(_("polyphonic rhythm"));
                }

                // Since there may be more than one instance of the
                // same drum, e.g., if a repeat is used, we look from
                // end of the list instead of the beginning of the
                // list.

                let drumIndex = -1;
                for (let i = 0; i < logo.rhythmRuler.Drums.length; i++) {
                    const j = logo.rhythmRuler.Drums.length - i - 1;
                    if (logo.rhythmRuler.Drums[j] === logo._currentDrumBlock) {
                        drumIndex = j;
                        break;
                    }
                }

                if (drumIndex !== -1) {
                    for (let i = 0; i < arg0; i++) {
                        logo.rhythmRuler.Rulers[drumIndex][0].push(noteBeatValue);
                    }
                }
            } else {
                const tur = activity.turtles.ithTurtle(turtle);

                if (tur.singer.drumStyle.length > 0) {
                    // Play rhythm block as if it were a drum
                    logo.clearNoteParams(tur, blk, tur.singer.drumStyle);
                    tur.singer.inNoteBlock.push(blk);
                } else {
                    // Or use the current synth.
                    logo.clearNoteParams(tur, blk, []);
                    tur.singer.inNoteBlock.push(blk);
                    tur.singer.notePitches[last(tur.singer.inNoteBlock)] = ["G"];
                    tur.singer.noteOctaves[last(tur.singer.inNoteBlock)] = [4];
                    tur.singer.noteCents[last(tur.singer.inNoteBlock)] = [0];
                }

                const bpmFactor =
                    TONEBPM / tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM;

                const beatValue = bpmFactor / noteBeatValue;

                /**
                 * Plays a note in the rhythm.
                 *
                 * @param {number} thisBeat - Beat value for the note.
                 * @param {string} blk - Block identifier.
                 * @param {string} turtle - Turtle identifier.
                 * @param {Function} callback - Callback function.
                 * @param {number} timeout - Timeout value.
                 */
                const __rhythmPlayNote = (thisBeat, blk, turtle, callback, timeout) => {
                    setTimeout(
                        () => Singer.processNote(activity, thisBeat, false, blk, turtle, callback),
                        timeout
                    );
                };
                let __callback;

                for (let i = 0; i < arg0; i++) {
                    if (i === arg0 - 1) {
                        __callback = () => {
                            delete tur.singer.noteDrums[blk];
                            tur.singer.inNoteBlock.splice(tur.singer.inNoteBlock.indexOf(blk), 1);
                        };
                    } else {
                        __callback = null;
                    }

                    __rhythmPlayNote(noteBeatValue, blk, turtle, __callback, i * beatValue * 1000);
                }

                tur.doWait((arg0 - 1) * beatValue);
            }
        }
    }

    /**
     * Represents a block for generating rhythm patterns.
     * @extends {RhythmBlock}
     */
    class Rhythm2Block extends RhythmBlock {
        /**
         * Constructs a Rhythm2Block.
         */
        constructor() {
            super("rhythm2");
            this.setPalette(rhythmBlockPalette, activity);
            this.beginnerBlock(true);
            this.piemenuValuesC1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            this.setHelpString([
                _("The Rhythm block is used to generate rhythm patterns."),
                "documentation",
                null,
                "rhythm2"
            ]);
            this.extraWidth = 10;
            this.formBlock({
                /**
                 * @type {string}
                 * @description Block name.
                 */
                name:
                    this.lang === "ja"
                        ? //.TRANS: translate "rhythm1" as rhythm
                          _("rhythm1")
                        : _("rhythm"),

                /**
                 * @type {number}
                 * @description Number of arguments.
                 */
                args: 2,

                /**
                 * @type {Array}
                 * @description Default values for arguments.
                 */
                defaults: [3, 4],

                /**
                 * @type {Array}
                 * @description Argument labels.
                 */
                argLabels: [_("number of notes"), _("note value")],

                /**
                 * @type {Array}
                 * @description Argument types.
                 */
                argTypes: ["anyin", "anyin"]
            });
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 3 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for handling sixty-fourth note rhythms.
     * @extends {FlowBlock}
     */
    class SixtyFourthNoteBlock extends FlowBlock {
        /**
         * Constructs a SixtyFourthNoteBlock.
         */
        constructor() {
            super("sixtyfourthNote", _("1/64 note") + " 𝅘𝅥𝅱");
            this.setPalette(rhythmBlockPalette, activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 64 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a 1/32 note in a musical flow.
     * @extends {FlowBlock}
     */
    class ThirtySecondNoteBlock extends FlowBlock {
        /**
         * Constructs a ThirtySecondNoteBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("thirtysecondNote", _("1/32 note") + " 𝅘𝅥𝅰");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 32 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a 1/16 note in a musical flow.
     * @extends {FlowBlock}
     */
    class SixteenthNoteBlock extends FlowBlock {
        /**
         * Constructs a SixteenthNoteBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("sixteenthNote", _("1/16 note") + " 𝅘𝅥𝅯");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 16 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for an eighth note in a musical flow.
     * @extends {FlowBlock}
     */
    class EighthNoteBlock extends FlowBlock {
        /**
         * Constructs an EighthNoteBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("eighthNote", _("eighth note") + " ♪");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 8 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a quarter note in a musical flow.
     * @extends {FlowBlock}
     */
    class QuarterNoteBlock extends FlowBlock {
        /**
         * Constructs a QuarterNoteBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("quarterNote", _("quarter note") + " ♩");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a half note in a musical flow.
     * @extends {FlowBlock}
     */
    class HalfNoteBlock extends FlowBlock {
        /**
         * Constructs a HalfNoteBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("halfNote", _("half note") + " 𝅗𝅥");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a whole note in a musical flow.
     * @extends {FlowBlock}
     */
    class WholeNoteBlock extends FlowBlock {
        /**
         * Constructs a WholeNoteBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("wholeNote", _("whole note") + " 𝅝");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "rhythm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 1 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a tuplet with 2 notes in a musical flow.
     * @extends {FlowClampBlock}
     */
    class Tuplet2Block extends FlowClampBlock {
        /**
         * Constructs a Tuplet2Block instance.
         * @param {string} name - The name of the block.
         */
        constructor(name) {
            // TRANS: Do not modify the following line
            super(name || "tuplet2");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Form the block with specific parameters
            this.formBlock({
                //.TRANS: A tuplet is a note value divided into irregular time values.
                name: _("tuplet"),
                args: 2,
                defaults: [1, 4],
                argLabels: [_("number of notes"), _("note value")]
            });
            this.hidden = true;
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {Array} - An array representing the flow.
         */
        flow(args, logo, turtle, blk) {
            if (logo.inMatrix) {
                if (activity.blocks.blockList[blk].name === "tuplet3") {
                    logo.tupletParams.push([
                        args[0],
                        (1 / args[1]) * activity.turtles.ithTurtle(turtle).singer.beatFactor
                    ]);
                } else {
                    logo.tupletParams.push([
                        args[0],
                        args[1] * activity.turtles.ithTurtle(turtle).singer.beatFactor
                    ]);
                }

                logo.tuplet = true;
                logo.addingNotesToTuplet = false;
            }

            const listenerName = "_tuplet_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
                if (logo.inMatrix) {
                    logo.tuplet = false;
                    logo.addingNotesToTuplet = false;
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    /**
     * Represents a block for a tuplet with 3 notes in a musical flow.
     * @extends {Tuplet2Block}
     */
    class Tuplet3Block extends Tuplet2Block {
        /**
         * Constructs a Tuplet3Block instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("tuplet3");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Form the block with specific parameters
            this.formBlock({
                name: _("tuplet"),
                args: 2,
                defaults: [1, 4],
                argLabels: [_("number of notes"), _("note value")]
            });
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "tuplet3", x, y, [null, 1, 10, 9, 7]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "rhythm2", 0, 0, [9, 3, 4, 8]],
                [3, ["number", { value: 3 }], 0, 0, [2]],
                [4, "divide", 0, 0, [2, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 4 }], 0, 0, [4]],
                [7, "hidden", 0, 0, [0, null]],
                [8, "vspace", 0, 0, [2, null]],
                [9, "vspace", 0, 0, [0, 2]],
                [10, "divide", 0, 0, [0, 11, 12]],
                [11, ["number", { value: 1 }], 0, 0, [10]],
                [12, ["number", { value: 4 }], 0, 0, [10]]
            ]);
            this.hidden = true;
        }
    }
    /**
     * Represents a block for a tuplet with 4 notes in a musical flow.
     * @extends {FlowClampBlock}
     */
    class Tuplet4Block extends FlowClampBlock {
        /**
         * Constructs a Tuplet4Block instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("tuplet4");

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString([
                _(
                    "The Tuplet block is used to generate a group of notes played in a condensed amount of time."
                ),
                "documentation",
                null,
                "tuplet4"
            ]);
            // Set extra width for the block
            this.extraWidth = 30;
            // Form the block with specific parameters
            this.formBlock({
                name: _("tuplet"),
                args: 1,
                defaults: [1 / 4],
                argLabels: [_("note value")]
            });
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "tuplet4", x, y, [null, 1, 4, 17]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 2 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "rhythm2", 0, 0, [4, 6, 7, 10]],
                [6, ["number", { value: 6 }], 0, 0, [5]],
                [7, "divide", 0, 0, [5, 8, 9]],
                [8, ["number", { value: 1 }], 0, 0, [7]],
                [9, ["number", { value: 16 }], 0, 0, [7]],
                [10, "vspace", 0, 0, [5, 11]],
                [11, "rhythm2", 0, 0, [10, 12, 13, 16]],
                [12, ["number", { value: 1 }], 0, 0, [11]],
                [13, "divide", 0, 0, [11, 14, 15]],
                [14, ["number", { value: 1 }], 0, 0, [13]],
                [15, ["number", { value: 4 }], 0, 0, [13]],
                [16, "vspace", 0, 0, [11, null]],
                [17, "hidden", 0, 0, [0, 18]],
                [18, "hidden", 0, 0, [17, null]]
            ]);
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {Array} - An array representing the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // nothing to do
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number" || args[0] <= 0) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 2;
            } else {
                arg = args[0];
            }

            if (!logo.inMatrix) {
                logo.tupletRhythms = [];
                logo.tupletParams = [];
            }

            logo.tuplet = true;
            logo.addingNotesToTuplet = false;
            logo.tupletParams.push([
                1,
                (1 / arg) * activity.turtles.ithTurtle(turtle).singer.beatFactor
            ]);

            const listenerName = "_tuplet_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
                const tur = activity.turtles.ithTurtle(turtle);

                logo.tuplet = false;
                logo.addingNotesToTuplet = false;
                if (!logo.inMatrix) {
                    const beatValues = [];

                    for (let i = 0; i < logo.tupletRhythms.length; i++) {
                        const tupletParam = [logo.tupletParams[logo.tupletRhythms[i][1]]];
                        tupletParam.push([]);
                        let tupletBeats = 0;
                        for (let j = 2; j < logo.tupletRhythms[i].length; j++) {
                            tupletBeats += 1 / logo.tupletRhythms[i][j];
                            tupletParam[1].push(logo.tupletRhythms[i][j]);
                        }

                        const factor = tupletParam[0][0] / (tupletParam[0][1] * tupletBeats);
                        for (let j = 2; j < logo.tupletRhythms[i].length; j++) {
                            beatValues.push(logo.tupletRhythms[i][j] / factor);
                        }
                    }

                    // Play rhythm block as if it were a drum.
                    if (tur.singer.drumStyle.length > 0) {
                        logo.clearNoteParams(tur, blk, tur.singer.drumStyle);
                    } else {
                        logo.clearNoteParams(tur, blk, [DEFAULTDRUM]);
                    }

                    tur.singer.inNoteBlock.push(blk);

                    const bpmFactor =
                        TONEBPM / tur.singer.bpm.length > 0
                            ? last(tur.singer.bpm)
                            : Singer.masterBPM;

                    let totalBeats = 0;

                    const __tupletPlayNote = (thisBeat, blk, turtle, callback, timeout) => {
                        setTimeout(
                            () =>
                                Singer.processNote(
                                    activity,
                                    thisBeat,
                                    false,
                                    blk,
                                    turtle,
                                    callback
                                ),
                            timeout
                        );
                    };

                    let timeout = 0;
                    let beatValue;
                    let __callback = null;
                    for (let i = 0; i < beatValues.length; i++) {
                        const thisBeat = beatValues[i];
                        beatValue = bpmFactor / thisBeat;

                        if (i === beatValues.length - 1) {
                            __callback = () => {
                                delete tur.singer.noteDrums[blk];
                                tur.singer.inNoteBlock.splice(
                                    tur.singer.inNoteBlock.indexOf(blk),
                                    1
                                );
                            };
                        } else {
                            __callback = null;
                        }

                        __tupletPlayNote(thisBeat, blk, turtle, __callback, timeout);

                        timeout += beatValue * 1000;
                        totalBeats += beatValue;
                    }

                    tur.doWait(totalBeats - beatValue);
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block for a septuplet note in a musical flow.
     * @extends {FlowBlock}
     */
    class SeptupletBlock extends FlowBlock {
        /**
         * Constructs a SeptupletBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("stuplet7", _("septuplet"));

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 7 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a quintuplet note in a musical flow.
     * @extends {FlowBlock}
     */
    class QuintupletBlock extends FlowBlock {
        /**
         * Constructs a QuintupletBlock instance.
         */
        constructor() {
            // TRANS: Do not modify the following line
            super("stuplet5", _("quintuplet"));

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a triplet note in a musical flow.
     * @extends {FlowBlock}
     */
    class TripletBlock extends FlowBlock {
        /**
         * Constructs a TripletBlock instance.
         */
        constructor() {
            // TRANS: A tuplet divided into 3 time values.
            super("stuplet3", _("triplet"));

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set the help string for the block
            this.setHelpString();
            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 3 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a block for a simple tuplet note in a musical flow.
     * @extends {FlowBlock}
     */
    class STupletBlock extends FlowBlock {
        /**
         * Constructs a STupletBlock instance.
         */
        constructor() {
            super("stuplet", _("simple tuplet"));

            // Set the palette and activity for the block
            this.setPalette(rhythmBlockPalette, activity);
            // Set piemenu values for C1
            this.piemenuValuesC1 = [3, 5, 7, 11];
            // Set beginner block for music blocks
            this.beginnerBlock(_THIS_IS_MUSIC_BLOCKS_);
            // Set the help string for the block
            this.setHelpString([
                _("Tuplets are a collection of notes that get scaled to a specific duration.") +
                    " " +
                    _(
                        "Using tuplets makes it easy to create groups of notes that are not based on a power of 2."
                    ),
                "documentation",
                null,
                "matrix"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                args: 2,
                defaults: [3, 1 / 2],
                argLabels: [_("number of notes"), _("note value")]
            });

            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "stuplet", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 3 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 2 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            let arg0, arg1;
            if (args[0] === null || typeof args[0] !== "number" || args[0] <= 0) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = 3;
            } else {
                arg0 = args[0];
            }

            if (args[1] === null || typeof args[1] !== "number" || args[1] <= 0) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 1 / 2;
            } else {
                arg1 = args[1];
            }

            const noteBeatValue = (1 / arg1) * activity.turtles.ithTurtle(turtle).singer.beatFactor;
            if (logo.inMatrix || logo.tuplet) {
                logo.phraseMaker.addColBlock(blk, arg0);
                if (logo.tuplet) {
                    // The simple-tuplet block is inside.
                    for (let i = 0; i < arg0; i++) {
                        if (!logo.addingNotesToTuplet) {
                            logo.tupletRhythms.push(["notes", 0]);
                            logo.addingNotesToTuplet = true;
                        }

                        Singer.processNote(activity, noteBeatValue, false, blk, turtle);
                    }
                } else {
                    logo.tupletParams.push([1, noteBeatValue]);
                    const obj = ["simple", 0];
                    for (let i = 0; i < arg0; i++) {
                        obj.push((1 / arg1) * activity.turtles.ithTurtle(turtle).singer.beatFactor);
                    }
                    logo.tupletRhythms.push(obj);
                }
            } else {
                const tur = activity.turtles.ithTurtle(turtle);

                // Play rhythm block as if it were a drum
                if (tur.singer.drumStyle.length > 0) {
                    logo.clearNoteParams(tur, blk, tur.singer.drumStyle);
                } else {
                    logo.clearNoteParams(tur, blk, [DEFAULTDRUM]);
                }

                tur.singer.inNoteBlock.push(blk);

                const bpmFactor =
                    TONEBPM / tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM;

                const beatValue = bpmFactor / noteBeatValue / arg0;

                const __rhythmPlayNote = (thisBeat, blk, turtle, callback, timeout) => {
                    setTimeout(
                        () => Singer.processNote(activity, thisBeat, false, blk, turtle, callback),
                        timeout
                    );
                };

                let __callback = null;
                for (let i = 0; i < arg0; i++) {
                    if (i === arg0 - 1) {
                        __callback = () => {
                            delete tur.singer.noteDrums[blk];
                            tur.singer.inNoteBlock.splice(tur.singer.inNoteBlock.indexOf(blk), 1);
                        };
                    } else {
                        __callback = null;
                    }

                    __rhythmPlayNote(
                        noteBeatValue * arg0,
                        blk,
                        turtle,
                        __callback,
                        i * beatValue * 1000
                    );
                }

                tur.doWait((arg0 - 1) * beatValue);
            }
        }
    }

    new RhythmBlock().setup(activity);
    new Rhythm2Block().setup(activity);
    new SixtyFourthNoteBlock().setup(activity);
    new ThirtySecondNoteBlock().setup(activity);
    new SixteenthNoteBlock().setup(activity);
    new EighthNoteBlock().setup(activity);
    new QuarterNoteBlock().setup(activity);
    new HalfNoteBlock().setup(activity);
    new WholeNoteBlock().setup(activity);
    new Tuplet2Block().setup(activity);
    new Tuplet3Block().setup(activity);
    new Tuplet4Block().setup(activity);
    new SeptupletBlock().setup(activity);
    new QuintupletBlock().setup(activity);
    new TripletBlock().setup(activity);
    new STupletBlock().setup(activity);
}
