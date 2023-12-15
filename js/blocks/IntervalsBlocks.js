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
    class SetTemperamentBlock extends FlowBlock {
        constructor() {
            super("settemperament", _("set temperament"));
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set temperament block is used to choose the tuning system used by Music Blocks."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 3,
                argLabels: [_("temperament"), _("pitch"), _("octave")]
            });
            this.makeMacro((x, y) => [
                [0, "settemperament", x, y, [null, 1, 2, 3, null]],
                [1, ["temperamentname", { value: "equal" }], 0, 0, [0]],
                [2, ["notename", { value: "C" }], 0, 0, [0]],
                [3, ["number", { value: 4 }], 0, 0, [0]]
            ]);
        }

        flow(args) {
            Singer.IntervalsActions.setTemperament(args[0], args[1], args[2]);
        }
    }

    class TemperamentNameBlock extends ValueBlock {
        constructor() {
            super("temperamentname", _("temperament name"));
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

    class ModeNameBlock extends ValueBlock {
        constructor() {
            super("modename");
            this.setPalette("intervals", activity);
            this.setHelpString();
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
            this.hidden = true;
        }
    }

    class ChordNameBlock extends ValueBlock {
        constructor() {
            super("chordname");
            this.setPalette("intervals", activity);
            this.setHelpString();
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
            this.hidden = true;
        }
    }

    class DoublyBlock extends LeftBlock {
        constructor() {
            // TRANS: doubly means to apply an augmentation or diminishment twice
            super("doubly", _("doubly"));
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

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            //find block at end of chain
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

    class IntervalNameBlock extends ValueBlock {
        constructor() {
            super("intervalname");
            this.setPalette("intervals", activity);
            this.setHelpString();
            this.extraWidth = 50;
            this.formBlock({ outType: "numberout" });
        }
    }

    class IntervalNumberBlock extends ValueBlock {
        constructor() {
            super("intervalnumber", _("interval number"));
            this.setPalette("intervals", activity);
            this.setHelpString([_("The Interval number block returns the number of scalar steps in the current interval.") , 
                                  "" ,
                                  "" 
                                ]);
            this.beginnerBlock(true);
            this.hidden = true;
            this.formBlock({ outType: "numberout" });
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

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

    class MeasureIntervalSemitonesBlock extends LeftBlock {
        constructor() {
            super("measureintervalsemitones");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Semi-tone interval block measures the distance between two notes in semi-tones."),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: measure the distance between two pitches in semi-tones
                name: _("semi-tone interval measure"),
                flows: { labels: [""], type: "flow" }
            });
        }

        arg(logo, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            const tur = activity.turtles.ithTurtle(turtle);

            const saveSuppressStatus = tur.singer.suppressOutput;

            // We need to save the state of the boxes, dicts, and heap
            // although there is a potential of a boxes
            // collision with other turtles.
            const saveBoxes = JSON.stringify(logo.boxes);
            const saveTurtleHeaps = JSON.stringify(logo.turtleHeaps[turtle]);
            // And the turtle state
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

            for (const b in tur.endOfClampSignals) {
                tur.butNotThese[b] = [];
                for (const i in tur.endOfClampSignals[b]) {
                    tur.butNotThese[b].push(i);
                }
            }

            const actionArgs = [];
            const saveNoteCount = tur.singer.notesPlayed;
            const saveTurtleDicts = JSON.stringify(logo.turtleDicts[turtle]);
            let distance = 0;
            tur.running = true;
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

            // FIXME: we need to handle cascading.
            tur.butNotThese = {};
            return distance;
        }
    }

    class MeasureIntervalScalarBlock extends LeftBlock {
        constructor() {
            super("measureintervalscalar");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Scalar interval block measures the distance between two notes in the current key and mode."),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: measure the distance between two pitches in steps of musical scale
                name: _("scalar interval measure"),
                flows: { labels: [""], type: "flow" }
            });
        }

        arg(logo, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            const tur = activity.turtles.ithTurtle(turtle);

            const saveSuppressStatus = tur.singer.suppressOutput;

            // We need to save the state of the boxes, dicts, and heap
            // although there is a potential of a boxes
            // collision with other turtles.
            const saveBoxes = JSON.stringify(logo.boxes);
            const saveTurtleHeaps = JSON.stringify(logo.turtleHeaps[turtle]);
            const saveTurtleDicts = JSON.stringify(logo.turtleDicts[turtle]);
            // And the turtle state
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

            for (const b in tur.endOfClampSignals) {
                tur.butNotThese[b] = [];
                for (const i in tur.endOfClampSignals[b]) {
                    tur.butNotThese[b].push(i);
                }
            }

            const actionArgs = [];
            const saveNoteCount = tur.singer.notesPlayed;
            tur.running = true;
            let distance = 0;
            logo.runFromBlockNow(logo, turtle, cblk, true, actionArgs, tur.queue.length);

            if (tur.singer.firstPitch.length > 0 && tur.singer.lastPitch.length > 0) {
                distance = Singer.scalarDistance(
                    logo,
                    turtle,
                    last(tur.singer.firstPitch),
                    last(tur.singer.lastPitch)
                );
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

            // FIXME: we need to handle cascading.
            tur.butNotThese = {};
            return distance;
        }
    }

    function makeSemitoneIntervalMacroBlocks() {
        class SemitoneIntervalMacroBlock extends FlowBlock {
            constructor(type, value, isDown) {
                super(
                    (isDown ? "down" : "") + type + value,
                    _((isDown ? "down " : "") + type) + " " + value
                );
                this.setPalette("intervals", activity);
                this.setHelpString();
                this.makeMacro((x, y) => [
                    [0, "semitoneinterval", x, y, [null, 1, 6, 7]],
                    ...[isDown ? [1, "minus", 0, 0, [0, 8, 3]] : [1, "plus", 0, 0, [0, 2, 3]]],
                    [2, ["intervalname", { value: type + " " + value }], 0, 0, [1]],
                    [3, "multiply", 0, 0, [1, 4, 5]],
                    [4, ["number", { value: 0 }], 0, 0, [3]],
                    [5, ["number", { value: 12 }], 0, 0, [3]],
                    [6, "vspace", 0, 0, [0, null]],
                    [7, "hidden", 0, 0, [0, null]],
                    ...(isDown ? [[8, "neg", 0, 0, [1, 2]]] : [])
                ]);
            }
        }
        // DEPRECATED: no verbose macros required, only major 3rd for reference

        // for (let i = 2; i <= 8; i++)
        //     new SemitoneIntervalMacroBlock("diminished", i).setup(activity);
        // for (let i = 1; i <= 8; i++)
        //     new SemitoneIntervalMacroBlock("augmented", i).setup(activity);
        // for (let i in [8, 5, 4])
        //     new SemitoneIntervalMacroBlock("perfect", i).setup(activity);
        // new SemitoneIntervalMacroBlock("minor", 6, true).setup(activity);
        // new SemitoneIntervalMacroBlock("minor", 3, true).setup(activity);
        // for (let i in [7, 6, 3, 2])
        //     new SemitoneIntervalMacroBlock("minor", i).setup(activity);
        // new SemitoneIntervalMacroBlock("major", 6, true).setup(activity);

        new SemitoneIntervalMacroBlock("major", 3, false).setup(activity);

        // for (let i in [7, 6, 3, 2])
        //     new SemitoneIntervalMacroBlock("major", i).setup(activity);
    }

    class PerfectBlock extends FlowClampBlock {
        constructor() {
            super("perfect");
            this.setPalette("intervals", activity);
            this.setHelpString();
            this.formBlock({
                name: _("perfect"),
                args: 1,
                defaults: [5]
            });
            this.hidden = true;
        }
    }

    class SemitoneIntervalBlock extends FlowClampBlock {
        constructor() {
            super("semitoneinterval");
            this.setPalette("intervals", activity);
            this.piemenuValuesC1 = [
                -12,
                -11,
                -10,
                -9,
                -8,
                -7,
                -6,
                -5,
                -4,
                -3,
                -2,
                -1,
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12
            ];
            this.setHelpString([
                _("The Semi-tone interval block calculates a relative interval based on half steps.") +
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

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            Singer.IntervalsActions.setSemitoneInterval(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    class ArpeggioBlock extends FlowClampBlock {
        constructor() {
            super("arpeggio");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Arpeggio block will run each note block multiple times, adding a transposition based on the specified chord.") +
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
            const __listener = event => {
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
                    const lastConnection =
                        activity.blocks.blockList[child].connections.length - 1;
                    const nextBlk =
                        activity.blocks.blockList[child].connections[
                            lastConnection
                        ];
                    // Don't disconnect a hidden block from its parent.
                    if (
                        nextBlk != null &&
                        activity.blocks.blockList[nextBlk].name === "hidden"
                    ) {
                        logo.connectionStore[turtle][blk].push([
                            nextBlk,
                            1,
                            activity.blocks.blockList[nextBlk].connections[1]
                        ]);
                        child =
                            activity.blocks.blockList[nextBlk].connections[1];
                        activity.blocks.blockList[
                            nextBlk
                        ].connections[1] = null;
                    } else {
                        logo.connectionStore[turtle][blk].push([
                            child,
                            lastConnection,
                            nextBlk
                        ]);
                        activity.blocks.blockList[child].connections[
                            lastConnection
                        ] = null;
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

    class ChordIntervalBlock extends FlowClampBlock {
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
                Singer.IntervalsActions.setChordInterval(
                    CHORDVALUES[i][ii], turtle, blk
                );
            }
            return [args[1], 1];
        }
    }
    

    class RatioIntervalBlock extends FlowClampBlock {
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
                defaults: [3 / 2]  // fifth
            });
            this.makeMacro((x, y) => [
                [0, "ratiointerval", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", {"value": 3}], 0, 0, [1]],
                [3, ["number", {"value": 2}], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
        }

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
            Singer.IntervalsActions.setRatioInterval(
                r, turtle, blk
            );
            return [args[1], 1];
        }
    }
    

    class ScalarIntervalBlock extends FlowClampBlock {
        constructor() {
            super("interval");
            this.setPalette("intervals", activity);
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Scalar interval block calculates a relative interval based on the current mode, skipping all notes outside of the mode.") +
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

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            Singer.IntervalsActions.setScalarInterval(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    class DefineModeBlock extends FlowClampBlock {
        constructor() {
            super("definemode");
            this.setPalette("intervals", activity);
            this.setHelpString([
                _("The Define mode block allows you define a custom mode by specifiying pitch numbers."),
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

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            Singer.IntervalsActions.defineMode(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    class MovableBlock extends FlowBlock {
        constructor() {
            super("movable", _("movable Do")); // legacy typo
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _("When Movable do is false, the solfege note names are always tied to specific pitches,") +
                    " " +
                    _('eg "do" is always "C-natural" when Movable do is true, the solfege note names are assigned to scale degrees "do" is always the first degree of the major scale.'),
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

        flow(args, logo, turtle) {
            if (args.length === 1) {
                Singer.IntervalsActions.setMovableDo(args[0], turtle);
            }
        }
    }

    class ModeLengthBlock extends ValueBlock {
        constructor() {
            //.TRANS:  mode length is the number of notes in the mode, e.g., 7 for major and minor scales; 12 for chromatic scales
            super("modelength", _("mode length"));
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Mode length block is the number of notes in the current scale.") +
                    " " +
                    _("Most Western scales have 7 notes."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "modelength"]);
            } else {
                return Singer.IntervalsActions.getModeLength(turtle);
            }
        }
    }

    class CurrentModeBlock extends ValueBlock {
        constructor() {
            //.TRANS: the mode in music is 'major', 'minor', etc.
            super("currentmode", _("current mode"));
            this.setPalette("intervals", activity);
            this.parameter = true;
            this.setHelpString();
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "currentmode"]);
            } else {
                return Singer.IntervalsActions.getCurrentMode(turtle);
            }
        }
    }

    class KeyBlock extends ValueBlock {
        constructor() {
            //.TRANS: the key is a group of pitches with which a music composition is created
            super("key", _("current key"));
            this.setPalette("intervals", activity);
            this.parameter = true;
            this.setHelpString();
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "key"]);
            } else {
                return Singer.IntervalsActions.getCurrentKey(turtle);
            }
        }
    }

    class SetKeyBlock extends FlowBlock {
        constructor() {
            super("setkey", _("set key"));
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);

            this.setHelpString();

            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: ["C"]
            });
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle) {
            if (args.length === 1) {
                activity.turtles.ithTurtle(turtle).singer.keySignature = args[0];
            }
        }
    }

    class SetKey2Block extends FlowBlock {
        constructor() {
            //.TRANS: set the key and mode, e.g. C Major
            super("setkey2", _("set key"));
            this.setPalette("intervals", activity);
            this.beginnerBlock(true);

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
            this.makeMacro((x, y) => [
                [0, "setkey2", x, y, [null, 1, 2, null]],
                [1, ["notename", { value: "C" }], 0, 0, [0]],
                [2, ["modename", { value: "major" }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2) {
                const modename = Singer.IntervalsActions.GetModename(args[1]);
                logo.modeBlock = activity.blocks.blockList[blk].connections[2];

                Singer.IntervalsActions.setKey(args[0], args[1], turtle, blk);

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
