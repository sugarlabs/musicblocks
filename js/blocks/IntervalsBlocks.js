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

   last, _, ValueBlock, FlowClampBlock, FlowBlock, NOINPUTERRORMSG,
   LeftBlock, Singer, CHORDNAMES, CHORDVALUES, DEFAULTCHORD,
   Queue, INTERVALVALUES
 */

/*
   Global locations
   - js/utils/utils.js
        _, last
   - js/protoblocks.js 
    ValueBlock, FlowClampBlock, LeftBlock, FlowBlock
   - js/logo.js
    NOINPUTERRORMSG
   - js/turtle-singer.js
    Singer
 */

/* exported setupIntervalsBlocks */

function setupIntervalsBlocks(activity) {
    /**
     * Represents a block for setting the temperament in Music Blocks.
     * @extends {FlowBlock}
     */
    class SetTemperamentBlock extends FlowBlock {
        /**
         * Constructs a SetTemperamentBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("settemperament", _("set temperament"));

            // Set the palette, activity, and beginner block for the SetTemperament block
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);

            // Set the help string for the SetTemperament block
            this.setHelpString([
                _(
                    "The Set temperament block is used to choose the tuning system used by Music Blocks."
                ),
                "documentation",
                ""
            ]);

            // Form the block with specific parameters
            this.formBlock({
                args: 3,
                argLabels: [_("temperament"), _("pitch"), _("octave")]
            });

            // Make the block a macro with specific structure
            this.makeMacro((x, y) => [
                [0, "settemperament", x, y, [null, 1, 2, 3, null]],
                [1, ["temperamentname", { value: "equal" }], 0, 0, [0]],
                [2, ["notename", { value: "C" }], 0, 0, [0]],
                [3, ["number", { value: 4 }], 0, 0, [0]]
            ]);
        }

        /**
         * Executes the flow of the SetTemperament block.
         * @param {string[]} args - The arguments for setting the temperament.
         */
        flow(args) {
            Singer.IntervalsActions.setTemperament(args[0], args[1], args[2]);
        }
    }

    /**
     * Represents a block for selecting a temperament name in Music Blocks.
     * @extends {ValueBlock}
     */
    class TemperamentNameBlock extends ValueBlock {
        /**
         * Constructs a TemperamentNameBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("temperamentname", _("temperament name"));

            // Set the palette, activity, extra width, and form the block with specific parameters
            this.setPalette("tone", activity);
            this.setHelpString([
                _("The Temperament name block is used to select a tuning method."),
                "documentation",
                ""
            ]);
            this.extraWidth = 50;
            this.hidden = true;
            this.formBlock({ outType: "anyout" });
        }
    }

    /**
     * Represents a block for selecting a mode name in Music Blocks.
     * @extends {ValueBlock}
     */
    class ModeNameBlock extends ValueBlock {
        /**
         * Constructs a ModeNameBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("modename");

            // Set the palette, activity, help string, extra width, and form the block with specific parameters
            this.setPalette("intervals", activity);
            this.setHelpString();
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
            this.hidden = true;
        }
    }

    /**
     * Represents a block for selecting a chord name in Music Blocks.
     * @extends {ValueBlock}
     */
    class ChordNameBlock extends ValueBlock {
        /**
         * Constructs a ChordNameBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("chordname");

            // Set the palette, activity, help string, extra width, and form the block with specific parameters
            this.setPalette("intervals", activity);
            this.setHelpString();
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
            this.hidden = true;
        }
    }

    /**
     * Represents a block for doubling the size of an interval in Music Blocks.
     * @extends {LeftBlock}
     */
    class DoublyBlock extends LeftBlock {
        /**
         * Constructs a DoublyBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("doubly", _("doubly"));

            // Set the palette, activity, help string, and form the block with specific parameters
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Doubly block will double the size of an interval."),
                "documentation",
                null,
                "doublyhelp"
            ]);
            this.formBlock({
                outType: "anyout",
                args: 1,
                argTypes: ["anyin"]
            });
        }

        /**
         * Retrieves the argument for the Doubly block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @param {*} receivedArg - The received argument.
         * @returns {*} - The argument for the Doubly block.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];

            // Find block at the end of the chain
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                let currentblock = cblk;
                let condition = true;

                while (condition) {
                    const blockToCheck = activity.blocks.blockList[currentblock];

                    if (blockToCheck.name === "intervalname") {
                        // Augmented or diminished only
                        if (blockToCheck.value[0] === "a") {
                            return logo.parseArg(logo, turtle, cblk, blk, receivedArg) + 1;
                        } else if (blockToCheck.value[0] === "d") {
                            return logo.parseArg(logo, turtle, cblk, blk, receivedArg) - 1;
                        } else {
                            return logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                        }
                    } else if (blockToCheck.name !== "doubly") {
                        const value = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

                        if (typeof value === "number") {
                            return value * 2;
                        } else if (typeof value === "string") {
                            return value + value;
                        } else {
                            return value;
                        }
                    }

                    currentblock = activity.blocks.blockList[currentblock].connections[1];

                    if (currentblock === null) {
                        condition = false;
                        return 0;
                    }
                }
            }
        }
    }

    /**
     * Represents a block for selecting an interval name in Music Blocks.
     * @extends {ValueBlock}
     */
    class IntervalNameBlock extends ValueBlock {
        /**
         * Constructs an IntervalNameBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("intervalname");

            // Set the palette, activity, help string, extra width, and form the block with specific parameters
            this.setPalette("intervals", activity);
            this.setHelpString();
            this.extraWidth = 50;
            this.formBlock({ outType: "numberout" });
        }
    }

    /**
     * Represents a block for retrieving the interval number in Music Blocks.
     * @extends {ValueBlock}
     */
    class IntervalNumberBlock extends ValueBlock {
        /**
         * Constructs an IntervalNumberBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("intervalnumber", _("interval number"));

            // Set the palette, activity, help string, beginner block, hidden status, and form the block with specific parameters
            this.setPalette("intervals", activity);
            this.setHelpString([
                _(
                    "The Interval number block returns the number of scalar steps in the current interval."
                ),
                "documentation",
                ""
            ]);
            this.beginnerBlock(true);
            this.hidden = true;
            this.formBlock({ outType: "numberout" });
        }

        /**
         * Updates the parameter for the IntervalNumber block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Retrieves the argument for the IntervalNumber block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @returns {*} - The argument for the IntervalNumber block.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "intervalnumber"]);
            } else {
                return Singer.IntervalsActions.GetIntervalNumber(turtle);
            }
        }
    }

    /**
     * Represents a block for measuring the distance between two notes in semi-tones in Music Blocks.
     * @extends {LeftBlock}
     */
    class MeasureIntervalSemitonesBlock extends LeftBlock {
        /**
         * Constructs a MeasureIntervalSemitonesBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("measureintervalsemitones");

            // Set the palette, activity, help string, and form the block with specific parameters
            this.setPalette("intervals", activity);
            this.setHelpString([
                _(
                    "The Semi-tone interval block measures the distance between two notes in semi-tones."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: measure the distance between two pitches in semi-tones
                name: _("semi-tone interval measure"),
                flows: { labels: [""], type: "flow" }
            });
        }

        /**
         * Retrieves the argument for the MeasureIntervalSemitones block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @returns {number} - The distance between two notes in semi-tones.
         */
        arg(logo, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];

            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            const tur = activity.turtles.ithTurtle(turtle);
            const saveSuppressStatus = tur.singer.suppressOutput;

            // Save the state of the boxes, dicts, and heap
            const saveBoxes = JSON.stringify(logo.boxes);
            const saveTurtleHeaps = JSON.stringify(logo.turtleHeaps[turtle]);
            const saveTurtleDicts = JSON.stringify(logo.turtleDicts[turtle]);

            // Save the turtle state
            const saveX = tur.x;
            const saveY = tur.y;
            const saveColor = tur.painter.color;
            const saveValue = tur.painter.value;
            const saveChroma = tur.painter.chroma;
            const saveStroke = tur.painter.stroke;
            const saveCanvasAlpha = tur.painter.canvasAlpha;
            const saveOrientation = tur.orientation;
            const savePenState = tur.painter.penState;

            tur.singer.suppressOutput = true;
            tur.singer.justCounting.push(true);
            tur.singer.justMeasuring.push(true);

            // Save the state of endOfClampSignals
            for (const b in tur.endOfClampSignals) {
                tur.butNotThese[b] = [];

                for (const i in tur.endOfClampSignals[b]) {
                    tur.butNotThese[b].push(i);
                }
            }

            const actionArgs = [];
            const saveNoteCount = tur.singer.notesPlayed;

            let distance = 0;
            tur.running = true;

            // Run the program from the specified block
            logo.runFromBlockNow(logo, turtle, cblk, true, actionArgs, tur.queue.length);

            if (tur.singer.firstPitch.length > 0 && tur.singer.lastPitch.length > 0) {
                distance = last(tur.singer.lastPitch) - last(tur.singer.firstPitch);
                tur.singer.firstPitch.pop();
                tur.singer.lastPitch.pop();
            } else {
                distance = 0;
                activity.errorMsg(_("You must use two pitch blocks when measuring an interval."));
            }

            tur.singer.notesPlayed = saveNoteCount;

            // Restore previous state
            logo.boxes = JSON.parse(saveBoxes);
            logo.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);
            logo.turtleDicts[turtle] = JSON.parse(saveTurtleDicts);

            tur.painter.doPenUp();
            tur.painter.doSetXY(saveX, saveY);
            tur.painter.color = saveColor;
            tur.painter.value = saveValue;
            tur.painter.chroma = saveChroma;
            tur.painter.stroke = saveStroke;
            tur.painter.canvasAlpha = saveCanvasAlpha;
            tur.painter.doSetHeading(saveOrientation);
            tur.painter.penState = savePenState;

            tur.singer.justCounting.pop();
            tur.singer.justMeasuring.pop();
            tur.singer.suppressOutput = saveSuppressStatus;

            // Handle cascading
            tur.butNotThese = {};

            return distance;
        }
    }

    /**
     * Class representing a block for measuring scalar intervals between two pitches.
     * @extends FlowClampBlock
     */
    class SemitoneIntervalBlock extends FlowClampBlock {
        /**
         * Constructor for SemitoneIntervalBlock.
         */
        constructor() {
            super("semitoneinterval");
            this.setPalette("intervals", activity);
            this.piemenuValuesC1 = [
                -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                11, 12
            ];
            this.setHelpString([
                _(
                    "The Semi-tone interval block calculates a relative interval based on half steps."
                ) +
                    " " +
                    _("In the figure, we add sol# to sol."),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: calculate a relative step between notes based on semi-tones
                name: _("semi-tone interval") + " (+/–)",
                args: 1,
                defaults: [5]
            });
            this.makeMacro((x, y) => [
                [0, "semitoneinterval", x, y, [null, 1, 6, 7]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 5 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, ["number", { value: 12 }], 0, 0, [3]],
                [6, "vspace", 0, 0, [0, null]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handle the flow of the semitone interval block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block ID.
         * @returns {Array} - The result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            Singer.IntervalsActions.setSemitoneInterval(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Class representing a block for creating arpeggios.
     * @extends FlowClampBlock
     */
    class ArpeggioBlock extends FlowClampBlock {
        /**
         * Constructor for ArpeggioBlock.
         */
        constructor() {
            super("arpeggio");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _(
                    "The Arpeggio block will run each note block multiple times, adding a transposition based on the specified chord."
                ) +
                    " " +
                    _("The output of the example is: do, mi, sol, sol, ti, mi"),
                "documentation",
                null,
                ""
            ]);

            this.formBlock({
                name: _("arpeggio"),
                argTypes: ["textin"],
                args: 1,
                defaults: [DEFAULTCHORD]
            });
            this.makeMacro((x, y) => [
                [0, "arpeggio", x, y, [null, 1, null, 2]],
                [1, ["chordname", { value: DEFAULTCHORD }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handle the flow of the arpeggio block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block ID.
         * @param {number} receivedArg - The received argument.
         */
        flow(args, logo, turtle, blk, receivedArg) {
            if (args[1] === undefined) return;

            let i = CHORDNAMES.indexOf(args[0]);
            if (i === -1) {
                i = CHORDNAMES.indexOf(DEFAULTCHORD);
            }
            const factor = Math.floor(CHORDVALUES[i].length);
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.duplicateFactor *= factor;
            tur.singer.arpeggio = [];
            for (let ii = 0; ii < CHORDVALUES[i].length; ii++) {
                tur.singer.arpeggio.push(CHORDVALUES[i][ii]);
            }

            // Queue each block in the clamp.
            const listenerName = "_duplicate_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            const __lookForOtherTurtles = (blk, turtle) => {
                for (const t in logo.connectionStore) {
                    if (t !== turtle.toString()) {
                        for (const b in logo.connectionStore[t]) {
                            if (b === blk.toString()) {
                                return t;
                            }
                        }
                    }
                }

                return null;
            };

            tur.singer.inDuplicate = true;

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
                tur.singer.inDuplicate = false;
                tur.singer.duplicateFactor /= factor;
                tur.singer.arpeggio = [];
                // Check for a race condition.
                // FIXME: Do something about the race condition.
                if (logo.connectionStoreLock) {
                    // eslint-disable-next-line no-console
                    console.debug("LOCKED");
                }

                logo.connectionStoreLock = true;

                // The last turtle should restore the broken connections.
                if (__lookForOtherTurtles(blk, turtle) === null) {
                    const n = logo.connectionStore[turtle][blk].length;
                    for (let i = 0; i < n; i++) {
                        const obj = logo.connectionStore[turtle][blk].pop();
                        activity.blocks.blockList[obj[0]].connections[obj[1]] = obj[2];
                        if (obj[2] != null) {
                            activity.blocks.blockList[obj[2]].connections[0] = obj[0];
                        }
                    }
                } else {
                    delete logo.connectionStore[turtle][blk];
                }
                logo.connectionStoreLock = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            // Test for race condition.
            // FIXME: Do something about the race condition.
            if (logo.connectionStoreLock) {
                // eslint-disable-next-line no-console
                console.debug("LOCKED");
            }

            logo.connectionStoreLock = true;

            // Check to see if another turtle has already disconnected these blocks
            const otherTurtle = __lookForOtherTurtles(blk, turtle);
            if (otherTurtle != null) {
                // Copy the connections and queue the blocks.
                logo.connectionStore[turtle][blk] = [];
                for (let i = logo.connectionStore[otherTurtle][blk].length; i > 0; i--) {
                    const obj = [
                        logo.connectionStore[otherTurtle][blk][i - 1][0],
                        logo.connectionStore[otherTurtle][blk][i - 1][1],
                        logo.connectionStore[otherTurtle][blk][i - 1][2]
                    ];
                    logo.connectionStore[turtle][blk].push(obj);
                    let child = obj[0];
                    if (activity.blocks.blockList[child].name === "hidden") {
                        child = activity.blocks.blockList[child].connections[0];
                    }

                    const queueBlock = new Queue(child, factor, blk, receivedArg);
                    tur.parentFlowQueue.push(blk);
                    tur.queue.push(queueBlock);
                }
            } else {
                let child = activity.blocks.findBottomBlock(args[1]);
                while (child != blk) {
                    if (activity.blocks.blockList[child].name !== "hidden") {
                        const queueBlock = new Queue(child, factor, blk, receivedArg);
                        tur.parentFlowQueue.push(blk);
                        tur.queue.push(queueBlock);
                    }
                    child = activity.blocks.blockList[child].connections[0];
                }

                // Break the connections between blocks in the clamp so
                // that when we run the queues, only the individual blocks,
                // each inserted into a semitoneinterval block, run.
                logo.connectionStore[turtle][blk] = [];
                child = args[1];
                while (child != null) {
                    const lastConnection = activity.blocks.blockList[child].connections.length - 1;
                    const nextBlk = activity.blocks.blockList[child].connections[lastConnection];
                    // Don't disconnect a hidden block from its parent.
                    if (nextBlk != null && activity.blocks.blockList[nextBlk].name === "hidden") {
                        logo.connectionStore[turtle][blk].push([
                            nextBlk,
                            1,
                            activity.blocks.blockList[nextBlk].connections[1]
                        ]);
                        child = activity.blocks.blockList[nextBlk].connections[1];
                        activity.blocks.blockList[nextBlk].connections[1] = null;
                    } else {
                        logo.connectionStore[turtle][blk].push([child, lastConnection, nextBlk]);
                        activity.blocks.blockList[child].connections[lastConnection] = null;
                        child = nextBlk;
                    }

                    if (child != null) {
                        activity.blocks.blockList[child].connections[0] = null;
                    }
                }
            }

            logo.connectionStoreLock = false;
        }
    }

    /**
     * Class representing a block for calculating chord intervals.
     * @extends FlowClampBlock
     */
    class ChordIntervalBlock extends FlowClampBlock {
        /**
         * Constructor for ChordIntervalBlock.
         */
        constructor() {
            super("chordinterval");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Chord block calculates common chords.") +
                    " " +
                    _("In the figure, we generate a C-major chord."),
                "documentation",
                ""
            ]);
            this.formBlock({
                name: _("chord"),
                args: 1,
                argTypes: ["textin"],
                defaults: [DEFAULTCHORD]
            });
            this.makeMacro((x, y) => [
                [0, "chordinterval", x, y, [null, 1, null, 2]],
                [1, ["chordname", { value: DEFAULTCHORD }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handle the flow of the chord interval block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block ID.
         * @returns {Array} - The result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let i = CHORDNAMES.indexOf(args[0]);
            if (i == -1) {
                i = CHORDNAMES.indexOf(DEFAULTCHORD);
            }
            for (let ii = 0; ii < CHORDVALUES[i].length; ii++) {
                if (isNaN(CHORDVALUES[i][ii][0])) {
                    continue;
                }
                if (CHORDVALUES[i][ii][0] === 0 && CHORDVALUES[i][ii][1] === 0) {
                    continue;
                }
                Singer.IntervalsActions.setChordInterval(CHORDVALUES[i][ii], turtle, blk);
            }
            return [args[1], 1];
        }
    }

    /**
     * Represents a block that calculates a relative interval based on semi-tones.
     * @extends {FlowClampBlock}
     */
    class SemitoneIntervalBlock extends FlowClampBlock {
        /**
         * Constructs a new SemitoneIntervalBlock.
         */
        constructor() {
            super("semitoneinterval");
            this.setPalette("intervals", activity);
            // Values for the piemenu (circle menu) representing semi-tone intervals.
            this.piemenuValuesC1 = [
                -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                11, 12
            ];
            this.setHelpString([
                _(
                    "The Semi-tone interval block calculates a relative interval based on half steps."
                ) +
                    " " +
                    _("In the figure, we add sol# to sol."),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: calculate a relative step between notes based on semi-tones
                name: _("semi-tone interval") + " (+/–)",
                args: 1,
                defaults: [5]
            });
            this.makeMacro((x, y) => [
                [0, "semitoneinterval", x, y, [null, 1, 6, 7]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 5 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, ["number", { value: 12 }], 0, 0, [3]],
                [6, "vspace", 0, 0, [0, null]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo interpreter.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {Block} blk - The block instance.
         * @returns {Array} - An array containing the result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            Singer.IntervalsActions.setSemitoneInterval(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block that runs each note block multiple times, adding transposition based on the specified chord.
     * @extends {FlowClampBlock}
     */
    class ArpeggioBlock extends FlowClampBlock {
        /**
         * Constructs a new ArpeggioBlock.
         */
        constructor() {
            super("arpeggio");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _(
                    "The Arpeggio block will run each note block multiple times, adding a transposition based on the specified chord."
                ) +
                    " " +
                    _("The output of the example is: do, mi, sol, sol, ti, mi"),
                "documentation",
                null,
                ""
            ]);

            this.formBlock({
                name: _("arpeggio"),
                argTypes: ["textin"],
                args: 1,
                defaults: [DEFAULTCHORD]
            });
            this.makeMacro((x, y) => [
                [0, "arpeggio", x, y, [null, 1, null, 2]],
                [1, ["chordname", { value: DEFAULTCHORD }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo interpreter.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {Block} blk - The block instance.
         * @param {boolean} receivedArg - Whether an argument is received.
         */
        flow(args, logo, turtle, blk, receivedArg) {
            if (args[1] === undefined) return;

            let i = CHORDNAMES.indexOf(args[0]);
            if (i === -1) {
                i = CHORDNAMES.indexOf(DEFAULTCHORD);
            }
            const factor = Math.floor(CHORDVALUES[i].length);
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.duplicateFactor *= factor;
            tur.singer.arpeggio = [];
            for (let ii = 0; ii < CHORDVALUES[i].length; ii++) {
                tur.singer.arpeggio.push(CHORDVALUES[i][ii]);
            }

            // ... (rest of the method body)
        }
    }

    /**
     * Represents a block that calculates common chords.
     * @extends {FlowClampBlock}
     */
    class ChordIntervalBlock extends FlowClampBlock {
        /**
         * Constructs a new ChordIntervalBlock.
         */
        constructor() {
            super("chordinterval");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Chord block calculates common chords.") +
                    " " +
                    _("In the figure, we generate a C-major chord."),
                "documentation",
                ""
            ]);
            this.formBlock({
                name: _("chord"),
                args: 1,
                argTypes: ["textin"],
                defaults: [DEFAULTCHORD]
            });
            this.makeMacro((x, y) => [
                [0, "chordinterval", x, y, [null, 1, null, 2]],
                [1, ["chordname", { value: DEFAULTCHORD }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo interpreter.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {Block} blk - The block instance.
         * @returns {Array} - An array containing the result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let i = CHORDNAMES.indexOf(args[0]);
            if (i == -1) {
                i = CHORDNAMES.indexOf(DEFAULTCHORD);
            }
            for (let ii = 0; ii < CHORDVALUES[i].length; ii++) {
                if (isNaN(CHORDVALUES[i][ii][0])) {
                    continue;
                }
                if (CHORDVALUES[i][ii][0] === 0 && CHORDVALUES[i][ii][1] === 0) {
                    continue;
                }
                Singer.IntervalsActions.setChordInterval(CHORDVALUES[i][ii], turtle, blk);
            }
            return [args[1], 1];
        }
    }

    /**
     * Represents a block that calculates an interval based on a ratio.
     * @extends {FlowClampBlock}
     */
    class RatioIntervalBlock extends FlowClampBlock {
        /**
         * Constructs a new RatioIntervalBlock.
         */
        constructor() {
            super("ratiointerval");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Ratio Interval block calculates an interval based on a ratio."),
                "documentation",
                ""
            ]);
            this.formBlock({
                name: _("ratio interval"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [3 / 2] // fifth
            });
            this.makeMacro((x, y) => [
                [0, "ratiointerval", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 3 }], 0, 0, [1]],
                [3, ["number", { value: 2 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo interpreter.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {Block} blk - The block instance.
         * @returns {Array} - An array containing the result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;
            const cblk = activity.blocks.blockList[blk].connections[1];
            let r = args[0];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                r = 1;
            } else if (activity.blocks.blockList[cblk].name === "intervalname") {
                const intervalName = activity.blocks.blockList[cblk].value;
                if (intervalName in INTERVALVALUES) {
                    r = INTERVALVALUES[intervalName][2];
                } else {
                    // eslint-disable-next-line no-console
                    console.log("could not find " + intervalName + " in INTERVALVALUES");
                    r = 1;
                }
            }

            if (isNaN(r) || r < 0) {
                r = 1;
                // eslint-disable-next-line no-console
                console.debug("ratio " + r + " must be a number > 0");
            }
            Singer.IntervalsActions.setRatioInterval(r, turtle, blk);
            return [args[1], 1];
        }
    }

    /**
     * Represents a block that calculates a relative interval based on the current mode.
     * @extends {FlowClampBlock}
     */
    class ScalarIntervalBlock extends FlowClampBlock {
        /**
         * Constructs a new ScalarIntervalBlock.
         */
        constructor() {
            super("interval");
            this.setPalette("intervals", activity);
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Scalar interval block calculates a relative interval based on the current mode, skipping all notes outside of the mode."
                ) +
                    " " +
                    _("In the figure, we add la to sol."),
                "documentation",
                null,
                "intervalhelp"
            ]);
            this.formBlock({
                //.TRANS: calculate a relative step between notes based on semi-tones
                name: _("scalar interval") + " (+/–)",
                args: 1,
                defaults: [5]
            });
            this.makeMacro((x, y) => [
                [0, "interval", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo interpreter.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {Block} blk - The block instance.
         * @returns {Array} - An array containing the result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            Singer.IntervalsActions.setScalarInterval(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block that allows defining a custom mode by specifying pitch numbers.
     * @extends {FlowClampBlock}
     */
    class DefineModeBlock extends FlowClampBlock {
        /**
         * Constructs a new DefineModeBlock.
         */
        constructor() {
            super("definemode");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _(
                    "The Define mode block allows you to define a custom mode by specifying pitch numbers."
                ),
                "documentation",
                null,
                "definemode"
            ]);
            this.formBlock({
                //.TRANS: define a custom mode
                name: _("define mode"),
                args: 1,
                canCollapse: true,
                argTypes: ["textin"],
                defaults: _("custom")
            });
            this.makeMacro((x, y) => [
                [0, "definemode", x, y, [null, 1, 2, 16]],
                [1, ["text", { value: "custom" }], 0, 0, [0]],
                [2, "pitchnumber", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 0 }], 0, 0, [2]],
                [4, "pitchnumber", 0, 0, [2, 5, 6]],
                [5, ["number", { value: 2 }], 0, 0, [4]],
                [6, "pitchnumber", 0, 0, [4, 7, 8]],
                [7, ["number", { value: 4 }], 0, 0, [6]],
                [8, "pitchnumber", 0, 0, [6, 9, 10]],
                [9, ["number", { value: 5 }], 0, 0, [8]],
                [10, "pitchnumber", 0, 0, [8, 11, 12]],
                [11, ["number", { value: 7 }], 0, 0, [10]],
                [12, "pitchnumber", 0, 0, [10, 13, 14]],
                [13, ["number", { value: 9 }], 0, 0, [12]],
                [14, "pitchnumber", 0, 0, [12, 15, null]],
                [15, ["number", { value: 11 }], 0, 0, [14]],
                [16, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo interpreter.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {Block} blk - The block instance.
         * @returns {Array} - An array containing the result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            Singer.IntervalsActions.defineMode(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block that controls the movable Do setting.
     * @extends {FlowBlock}
     */
    class MovableBlock extends FlowBlock {
        /**
         * Constructs a new MovableBlock.
         */
        constructor() {
            super("movable", _("movable Do")); // legacy typo
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "When Movable do is false, the solfege note names are always tied to specific pitches,"
                ) +
                    " " +
                    _(
                        'eg "do" is always "C-natural" when Movable do is true, the solfege note names are assigned to scale degrees "do" is always the first degree of the major scale.'
                    ),
                "documentation",
                null,
                "moveablehelp"
            ]);
            this.size = 0;
            this.formBlock({
                args: 1,
                argTypes: ["booleanin"]
            });
            this.makeMacro((x, y) => [
                [0, "movable", x, y, [null, 1, null]],
                [1, ["boolean", { value: true }], 0, 0, [0]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo interpreter.
         * @param {Turtle} turtle - The turtle associated with the block.
         */
        flow(args, logo, turtle) {
            if (args.length === 1) {
                Singer.IntervalsActions.setMovableDo(args[0], turtle);
            }
        }
    }

    /**
     * Represents a block that defines the mode length, i.e., the number of notes in the mode.
     * @class
     * @extends ValueBlock
     */
    class ModeLengthBlock extends ValueBlock {
        /**
         * Constructs a ModeLengthBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: mode length is the number of notes in the mode, e.g., 7 for major and minor scales; 12 for chromatic scales
            super("modelength", _("mode length"));

            // Set palette and activity for the block
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The Mode length block is the number of notes in the current scale.") +
                    " " +
                    _("Most Western scales have 7 notes."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {any} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {any} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "modelength"]);
            } else {
                return Singer.IntervalsActions.getModeLength(turtle);
            }
        }
    }

    /**
     * Represents a block that defines the current mode in music.
     * @class
     * @extends ValueBlock
     */
    class CurrentModeBlock extends ValueBlock {
        /**
         * Constructs a CurrentModeBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: the mode in music is 'major', 'minor', etc.
            super("currentmode", _("current mode"));

            // Set palette and activity for the block
            this.setPalette("intervals", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString();
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {any} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {any} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "currentmode"]);
            } else {
                return Singer.IntervalsActions.getCurrentMode(turtle);
            }
        }
    }

    /**
     * Represents a block that defines the current key in music.
     * @class
     * @extends ValueBlock
     */
    class KeyBlock extends ValueBlock {
        /**
         * Constructs a KeyBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: the key is a group of pitches with which a music composition is created
            super("key", _("current key"));

            // Set palette and activity for the block
            this.setPalette("intervals", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString();
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {any} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {any} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "key"]);
            } else {
                return Singer.IntervalsActions.getCurrentKey(turtle);
            }
        }
    }

    /**
     * Represents a block that sets the key for music.
     * @class
     * @extends FlowBlock
     */
    class SetKeyBlock extends FlowBlock {
        /**
         * Constructs a SetKeyBlock instance.
         * @constructor
         */
        constructor() {
            super("setkey", _("set key"));

            // Set palette and activity for the block
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString();

            // Form block with arguments and default values
            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: ["C"]
            });

            // Set block as hidden and deprecated
            this.hidden = this.deprecated = true;
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         */
        flow(args, logo, turtle) {
            if (args.length === 1) {
                activity.turtles.ithTurtle(turtle).singer.keySignature = args[0];
            }
        }
    }

    /**
     * Represents a block that sets the key and mode for music.
     * @class
     * @extends FlowBlock
     */
    class SetKey2Block extends FlowBlock {
        /**
         * Constructs a SetKey2Block instance.
         * @constructor
         */
        constructor() {
            //.TRANS: set the key and mode, e.g. C Major
            super("setkey2", _("set key"));

            // Set palette and activity for the block
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);

            // Set help string for the block based on beginner mode and language
            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _("The Set key block is used to set the key and mode,"),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Set key block is used to set the key and mode,") + " " + _("eg C Major"),
                    "documentation",
                    null,
                    "movablehelp"
                ]);
            }

            // Form block with arguments and labels
            this.formBlock({
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [
                    //.TRANS: key, e.g., C in C Major
                    _("key"),
                    //.TRANS: mode, e.g., Major in C Major
                    _("mode")
                ]
            });

            // Make a macro for the block
            this.makeMacro((x, y) => [
                [0, "setkey2", x, y, [null, 1, 2, null]],
                [1, ["notename", { value: "C" }], 0, 0, [0]],
                [2, ["modename", { value: "major" }], 0, 0, [0]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {Turtle} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                // Get the mode name and set the mode block connection
                const modename = Singer.IntervalsActions.GetModename(args[1]);
                logo.modeBlock = activity.blocks.blockList[blk].connections[2];

                // Set the key and mode using Singer.IntervalsActions.setKey method
                Singer.IntervalsActions.setKey(args[0], args[1], turtle, blk);

                // Update the key and mode for Turtle 0 if inside the mode widget
                if (logo.insideModeWidget) {
                    // Ensure logo the mode for Turtle 0 is set, since it is used by the mode widget
                    activity.turtles.ithTurtle(0).singer.keySignature = args[0] + " " + modename;
                    logo.notation.notationKey(0, args[0], modename);
                }
            }
        }
    }

    new SetTemperamentBlock().setup(activity);
    new TemperamentNameBlock().setup(activity);
    new ChordNameBlock().setup(activity);
    new ModeNameBlock().setup(activity);
    new DoublyBlock().setup(activity);
    new IntervalNameBlock().setup(activity);
    new IntervalNumberBlock().setup(activity);
    new MeasureIntervalSemitonesBlock().setup(activity);
    new MeasureIntervalScalarBlock().setup(activity);
    makeSemitoneIntervalMacroBlocks();
    new PerfectBlock().setup(activity);
    new ArpeggioBlock().setup(activity);
    new ChordIntervalBlock().setup(activity);
    new RatioIntervalBlock().setup(activity);
    new SemitoneIntervalBlock().setup(activity);
    // makeIntervalMacroBlocks();
    new ScalarIntervalBlock().setup(activity);
    new DefineModeBlock().setup(activity);
    new MovableBlock().setup(activity);
    new ModeLengthBlock().setup(activity);
    new CurrentModeBlock().setup(activity);
    new KeyBlock().setup(activity);
    new SetKeyBlock().setup(activity);
    new SetKey2Block().setup(activity);
}
