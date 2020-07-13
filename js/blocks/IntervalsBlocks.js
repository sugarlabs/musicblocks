function setupIntervalsBlocks() {
    class SetTemperamentBlock extends FlowBlock {
        constructor() {
            super("settemperament", _("set temperament"));
            this.setPalette("intervals");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set temperament block is used to choose the tuning system used by Music Blocks."
                ),
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

        flow(args, logo) {
            logo.synth.inTemperament = args[0];
            logo.synth.startingPitch = args[1] + "" + args[2];

            logo.temperamentSelected.push(args[0]);
            let len = logo.temperamentSelected.length;

            if (
                logo.temperamentSelected[len - 1] !==
                logo.temperamentSelected[len - 2]
            ) {
                logo.synth.changeInTemperament = true;
            }
        }
    }

    class TemperamentNameBlock extends ValueBlock {
        constructor() {
            super("temperamentname");
            this.setPalette("tone");
            this.setHelpString([
                _(
                    "The Temperament name block is used to select a tuning method."
                ),
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
            this.setPalette("intervals");
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
            this.setPalette("intervals");
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
            let cblk = logo.blocks.blockList[blk].connections[1];
            //find block at end of chain
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                let currentblock = cblk;
                while (true) {
                    let blockToCheck = logo.blocks.blockList[currentblock];
                    if (blockToCheck.name === "intervalname") {
                        // Augmented or diminished only
                        if (blockToCheck.value[0] === "a") {
                            return (
                                logo.parseArg(
                                    logo,
                                    turtle,
                                    cblk,
                                    blk,
                                    receivedArg
                                ) + 1
                            );
                        } else if (blockToCheck.value[0] === "d") {
                            return (
                                logo.parseArg(
                                    logo,
                                    turtle,
                                    cblk,
                                    blk,
                                    receivedArg
                                ) - 1
                            );
                        } else {
                            return logo.parseArg(
                                logo,
                                turtle,
                                cblk,
                                blk,
                                receivedArg
                            );
                        }
                    } else if (blockToCheck.name !== "doubly") {
                        let value = logo.parseArg(
                            logo,
                            turtle,
                            cblk,
                            blk,
                            receivedArg
                        );
                        if (typeof value === "number") {
                            return value * 2;
                        } else if (typeof value === "string") {
                            return value + value;
                        } else {
                            return value;
                        }
                    }

                    currentblock =
                        logo.blocks.blockList[currentblock].connections[1];
                    if (currentblock === null) {
                        return 0;
                    }
                }
            }
        }
    }

    class IntervalNameBlock extends ValueBlock {
        constructor() {
            super("intervalname");
            this.setPalette("intervals");
            this.setHelpString();
            this.extraWidth = 50;
            this.formBlock({ outType: "numberout" });
        }
    }

    class MeasureIntervalSemitonesBlock extends LeftBlock {
        constructor() {
            super("measureintervalsemitones");
            this.setPalette("intervals");
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

        arg(logo, turtle, blk) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                let saveSuppressStatus = logo.suppressOutput[turtle];

                // We need to save the state of the boxes and heap
                // although there is a potential of a boxes
                // collision with other turtles.
                let saveBoxes = JSON.stringify(logo.boxes);
                let saveTurtleHeaps = JSON.stringify(logo.turtleHeaps[turtle]);
                // And the turtle state
                let saveX = logo.turtles.turtleList[turtle].x;
                let saveY = logo.turtles.turtleList[turtle].y;
                let saveColor = logo.turtles.turtleList[turtle].painter.color;
                let saveValue = logo.turtles.turtleList[turtle].painter.value;
                let saveChroma = logo.turtles.turtleList[turtle].painter.chroma;
                let saveStroke = logo.turtles.turtleList[turtle].painter.stroke;
                let saveCanvasAlpha = logo.turtles.turtleList[turtle].painter.canvasAlpha;
                let saveOrientation =
                    logo.turtles.turtleList[turtle].orientation;
                let savePenState = logo.turtles.turtleList[turtle].painter.penState;

                logo.suppressOutput[turtle] = true;

                logo.justCounting[turtle].push(true);
                logo.justMeasuring[turtle].push(true);

                for (let b in logo.endOfClampSignals[turtle]) {
                    logo.butNotThese[turtle][b] = [];
                    for (
                        let i = 0;
                        i < logo.endOfClampSignals[turtle][b].length;
                        i++
                    ) {
                        logo.butNotThese[turtle][b].push(i);
                    }
                }

                let actionArgs = [];
                let saveNoteCount = logo.notesPlayed[turtle];
                logo.turtles.turtleList[turtle].running = true;
                logo.runFromBlockNow(
                    logo,
                    turtle,
                    cblk,
                    true,
                    actionArgs,
                    logo.turtles.turtleList[turtle].queue.length
                );
                if (
                    logo.firstPitch[turtle].length > 0 &&
                    logo.lastPitch[turtle].length > 0
                ) {
                    return (
                        last(logo.lastPitch[turtle]) -
                        last(logo.firstPitch[turtle])
                    );
                    logo.firstPitch[turtle].pop();
                    logo.lastPitch[turtle].pop();
                } else {
                    return 0;
                    logo.errorMsg(
                        _(
                            "You must use two pitch blocks when measuring an interval."
                        )
                    );
                }

                logo.notesPlayed[turtle] = saveNoteCount;

                // Restore previous state
                logo.boxes = JSON.parse(saveBoxes);
                logo.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);

                logo.turtles.turtleList[turtle].painter.doPenUp();
                logo.turtles.turtleList[turtle].painter.doSetXY(saveX, saveY);
                logo.turtles.turtleList[turtle].painter.color = saveColor;
                logo.turtles.turtleList[turtle].painter.value = saveValue;
                logo.turtles.turtleList[turtle].painter.chroma = saveChroma;
                logo.turtles.turtleList[turtle].painter.stroke = saveStroke;
                logo.turtles.turtleList[turtle].painter.canvasAlpha = saveCanvasAlpha;
                logo.turtles.turtleList[turtle].painter.doSetHeading(saveOrientation);
                logo.turtles.turtleList[turtle].painter.penState = savePenState;

                logo.justCounting[turtle].pop();
                logo.justMeasuring[turtle].pop();
                logo.suppressOutput[turtle] = saveSuppressStatus;

                // FIXME: we need to handle cascading.
                logo.butNotThese[turtle] = {};
            }
        }
    }

    class MeasureIntervalScalarBlock extends LeftBlock {
        constructor() {
            super("measureintervalscalar");
            this.setPalette("intervals");
            this.setHelpString([
                _(
                    "The Scalar interval block measures the distance between two notes in the current key and mode."
                ),
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
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                let saveSuppressStatus = logo.suppressOutput[turtle];

                // We need to save the state of the boxes and heap
                // although there is a potential of a boxes
                // collision with other turtles.
                let saveBoxes = JSON.stringify(logo.boxes);
                let saveTurtleHeaps = JSON.stringify(logo.turtleHeaps[turtle]);
                // And the turtle state
                let saveX = logo.turtles.turtleList[turtle].x;
                let saveY = logo.turtles.turtleList[turtle].y;
                let saveColor = logo.turtles.turtleList[turtle].painter.color;
                let saveValue = logo.turtles.turtleList[turtle].painter.value;
                let saveChroma = logo.turtles.turtleList[turtle].painter.chroma;
                let saveStroke = logo.turtles.turtleList[turtle].painter.stroke;
                let saveCanvasAlpha = logo.turtles.turtleList[turtle].painter.canvasAlpha;
                let saveOrientation =
                    logo.turtles.turtleList[turtle].orientation;
                let savePenState = logo.turtles.turtleList[turtle].painter.penState;

                logo.suppressOutput[turtle] = true;

                logo.justCounting[turtle].push(true);
                logo.justMeasuring[turtle].push(true);

                for (let b in logo.endOfClampSignals[turtle]) {
                    logo.butNotThese[turtle][b] = [];
                    for (
                        let i = 0;
                        i < logo.endOfClampSignals[turtle][b].length;
                        i++
                    ) {
                        logo.butNotThese[turtle][b].push(i);
                    }
                }

                let actionArgs = [];
                let saveNoteCount = logo.notesPlayed[turtle];
                logo.turtles.turtleList[turtle].running = true;
                logo.runFromBlockNow(
                    logo,
                    turtle,
                    cblk,
                    true,
                    actionArgs,
                    logo.turtles.turtleList[turtle].queue.length
                );

                if (
                    logo.firstPitch[turtle].length > 0 &&
                    logo.lastPitch[turtle].length > 0
                ) {
                    return Singer.scalarDistance(
                        logo, turtle, last(logo.firstPitch[turtle]), last(logo.lastPitch[turtle])
                    );

                    logo.firstPitch[turtle].pop();
                    logo.lastPitch[turtle].pop();
                } else {
                    return 0;
                    logo.errorMsg(
                        _(
                            "You must use two pitch blocks when measuring an interval."
                        )
                    );
                }

                logo.notesPlayed[turtle] = saveNoteCount;

                // Restore previous state
                logo.boxes = JSON.parse(saveBoxes);
                logo.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);

                logo.turtles.turtleList[turtle].painter.doPenUp();
                logo.turtles.turtleList[turtle].painter.doSetXY(saveX, saveY);
                logo.turtles.turtleList[turtle].painter.color = saveColor;
                logo.turtles.turtleList[turtle].painter.value = saveValue;
                logo.turtles.turtleList[turtle].painter.chroma = saveChroma;
                logo.turtles.turtleList[turtle].painter.stroke = saveStroke;
                logo.turtles.turtleList[turtle].painter.canvasAlpha = saveCanvasAlpha;
                logo.turtles.turtleList[turtle].painter.doSetHeading(saveOrientation);
                logo.turtles.turtleList[turtle].painter.penState = savePenState;

                logo.justCounting[turtle].pop();
                logo.justMeasuring[turtle].pop();
                logo.suppressOutput[turtle] = saveSuppressStatus;

                // FIXME: we need to handle cascading.
                logo.butNotThese[turtle] = {};
            }
        }
    }

    function makeSemitoneIntervalMacroBlocks() {
        class SemitoneIntervalMacroBlock extends FlowBlock {
            constructor(type, value, isDown) {
                super(
                    (isDown ? "down" : "") + type + value,
                    _((isDown ? "down " : "") + type) + " " + value
                );
                this.setPalette("intervals");
                this.setHelpString();
                this.makeMacro((x, y) => [
                    [0, "semitoneinterval", x, y, [null, 1, 6, 7]],
                    ...[
                        isDown
                            ? [1, "minus", 0, 0, [0, 8, 3]]
                            : [1, "plus", 0, 0, [0, 2, 3]]
                    ],
                    [
                        2,
                        ["intervalname", { value: type + " " + value }],
                        0,
                        0,
                        [1]
                    ],
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
        //     new SemitoneIntervalMacroBlock("diminished", i).setup();
        // for (let i = 1; i <= 8; i++)
        //     new SemitoneIntervalMacroBlock("augmented", i).setup();
        // for (let i in [8, 5, 4])
        //     new SemitoneIntervalMacroBlock("perfect", i).setup();
        // new SemitoneIntervalMacroBlock("minor", 6, true).setup();
        // new SemitoneIntervalMacroBlock("minor", 3, true).setup();
        // for (let i in [7, 6, 3, 2])
        //     new SemitoneIntervalMacroBlock("minor", i).setup();
        // new SemitoneIntervalMacroBlock("major", 6, true).setup();

        new SemitoneIntervalMacroBlock("major", 3, false).setup();
        
        // for (let i in [7, 6, 3, 2])
        //     new SemitoneIntervalMacroBlock("major", i).setup();
    }

    class PerfectBlock extends FlowClampBlock {
        constructor() {
            super("perfect");
            this.setPalette("intervals");
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
            this.setPalette("intervals");
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

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            } else {
                arg = args[0];
            }

            let i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
            if (i !== 0) {
                logo.semitoneIntervals[turtle].push([
                    i,
                    logo.noteDirection[turtle]
                ]);
                logo.noteDirection[turtle] = 0;

                let listenerName = "_semitone_interval_" + turtle;
                logo.setDispatchBlock(blk, turtle, listenerName);

                let __listener = function() {
                    logo.semitoneIntervals[turtle].pop();
                };

                logo.setTurtleListener(turtle, listenerName, __listener);
            }

            return [args[1], 1];
        }
    }
    
    // DEPRECATED: verbose macros, no longer needed

    // function makeIntervalMacroBlocks() {
    //     class ChordIntervalMacroBlock extends FlowBlock {
    //         constructor(name, display, value1, value2) {
    //             super(name, _(display));
    //             this.setPalette("intervals");
    //             this.beginnerBlock(true);
    //             this.setHelpString();
    //             this.makeMacro((x, y) => [
    //                 [0, "interval", x, y, [null, 1, 3, 2]],
    //                 [1, ["number", { value: value1 }], 0, 0, [0]],
    //                 [2, "hidden", 0, 0, [0, null]],
    //                 [3, "interval", 0, 0, [0, 4, 6, 5]],
    //                 [4, ["number", { value: value2 }], 0, 0, [3]],
    //                 [5, "hidden", 0, 0, [3, null]],
    //                 [
    //                     6,
    //                     ["newnote", { collapsed: false }],
    //                     0,
    //                     0,
    //                     [3, 7, 10, 14]
    //                 ],
    //                 [7, "divide", 0, 0, [6, 8, 9]],
    //                 [8, ["number", { value: 1 }], 0, 0, [7]],
    //                 [9, ["number", { value: 1 }], 0, 0, [7]],
    //                 [10, "vspace", 0, 0, [6, 11]],
    //                 [11, "pitch", 0, 0, [10, 12, 13, null]],
    //                 [12, ["solfege", { value: "do" }], 0, 0, [11]],
    //                 [13, ["number", { value: 4 }], 0, 0, [11]],
    //                 [14, "hidden", 0, 0, [6, null]]
    //             ]);
    //         }
    //     }
    //     class IntervalMacroBlock extends FlowBlock {
    //         constructor(name, value, down) {
    //             super(
    //                 (down ? "down" : "") + name + "interval",
    //                 _((down ? "down " : "") + name)
    //             );
    //             this.setPalette("intervals");
    //             this.beginnerBlock(value === 2 || value === 5);
    //             this.setHelpString();
    //             this.makeMacro((x, y) => [
    //                 [0, "interval", x, y, [null, 1, 6, 8]],
    //                 [1, down ? "minus" : "plus", 0, 0, [0, 2, 3]],
    //                 [2, ["number", { value: value }], 0, 0, [1]],
    //                 [3, "multiply", 0, 0, [1, 4, 5]],
    //                 [4, ["number", { value: 0 }], 0, 0, [3]],
    //                 [5, "modelength", 0, 0, [3]],
    //                 [6, "vspace", 0, 0, [0, 7]],
    //                 [7, "vspace", 0, 0, [6, null]],
    //                 [8, "hidden", 0, 0, [0, null]]
    //             ]);
    //         }
    //     }
    //     let lang = localStorage.languagePreference || navigator.language;

    //     new ChordIntervalMacroBlock(
    //         "chordV",
    //         lang === "ja" ? _("chord5") : _("chord") + " V",
    //         3,
    //         2
    //     ).setup();
    //     new ChordIntervalMacroBlock(
    //         "chordIV",
    //         lang === "ja" ? _("chord4") : _("chord") + " IV",
    //         5,
    //         2
    //     ).setup();
    //     new ChordIntervalMacroBlock(
    //         "chordI",
    //         lang === "ja" ? _("chord1") : _("chord") + " I",
    //         4,
    //         2
    //     ).setup();

    //     //.TRANS: down <n>th means the note is <n - 1> scale degrees below current note
    //     //.TRANS: <n>th means the note is the <n - 1> scale degrees above current note
    //     new IntervalMacroBlock("sixth", -5, true).setup();
    //     new IntervalMacroBlock("third", -2, true).setup();
    //     new IntervalMacroBlock("seventh", 6, true).setup();
    //     new IntervalMacroBlock("sixth", 5, true).setup();
    //     new IntervalMacroBlock("fifth", 4, true).setup();
    //     new IntervalMacroBlock("fourth", 3, true).setup();
    //     new IntervalMacroBlock("third", 2, true).setup();
    //     new IntervalMacroBlock("second", 1, true).setup();
    //     new IntervalMacroBlock("unison", 0, true).setup();
    // }

    class ScalarIntervalBlock extends FlowClampBlock {
        constructor() {
            super("interval");
            this.setPalette("intervals");
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

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            } else {
                arg = args[0];
            }

            let i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
            logo.intervals[turtle].push(i);

            let listenerName = "_interval_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                logo.intervals[turtle].pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class DefineModeBlock extends FlowClampBlock {
        constructor() {
            super("definemode");
            this.setPalette("intervals");
            this.setHelpString([
                _(
                    "The Define mode block allows you define a custom mode by specifiying pitch numbers."
                ),
                "documentation",
                null,
                "definemode"
            ]);
            this.formBlock({
                //.TRANS: define a custom mode
                name: _("define mode"),
                args: 1,
                argTypes: ["textin"],
                defaults: _("custom")
            });
            this.makeMacro((x, y) => [
                [0, "definemode", x, y, [null, 1, 2, 16]],
                [1, ["modename", { value: "custom" }], 0, 0, [0]],
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
            if (args[1] === undefined) {
                // nothing to do
                return;
            }

            logo.inDefineMode[turtle] = true;
            logo.defineMode[turtle] = [];
            let modeName;
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                modeName = "custom";
            } else {
                modeName = args[0].toLowerCase();
            }

            let listenerName = "_definemode_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
                MUSICALMODES[modeName] = [];
                if (logo.defineMode[turtle].indexOf(0) === -1) {
                    logo.defineMode[turtle].push(0);
                    logo.errorMsg(_("Adding missing pitch number 0."));
                }

                let pitchNumbers = logo.defineMode[turtle].sort(function(a, b) {
                    return a[0] - b[0];
                });

                for (let i = 0; i < pitchNumbers.length; i++) {
                    if (pitchNumbers[i] < 0 || pitchNumbers[i] > 11) {
                        logo.errorMsg(
                            _(
                                "Ignoring pitch numbers less than zero or greater than eleven."
                            )
                        );
                        continue;
                    }

                    if (i > 0 && pitchNumbers[i] === pitchNumbers[i - 1]) {
                        logo.errorMsg(_("Ignoring duplicate pitch numbers."));
                        continue;
                    }

                    if (i < pitchNumbers.length - 1) {
                        MUSICALMODES[modeName].push(
                            pitchNumbers[i + 1] - pitchNumbers[i]
                        );
                    } else {
                        MUSICALMODES[modeName].push(12 - pitchNumbers[i]);
                    }
                }

                let cblk = logo.blocks.blockList[blk].connections[1];
                if (logo.blocks.blockList[cblk].name === "modename") {
                    logo.blocks.updateBlockText(cblk);
                }

                logo.inDefineMode[turtle] = false;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class MoveableBlock extends FlowBlock {
        constructor() {
            super("movable", _("moveable Do")); // legacy typo
            this.setPalette("intervals");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "When Moveable do is false, the solfege note names are always tied to specific pitches,"
                ) +
                    " " +
                    _(
                        'eg "do" is always "C-natural"); when Moveable do is true, the solfege note names are assigned to scale degrees ("do" is always the first degree of the major scale).'
                    ),
                "documentation",
                null,
                "movablehelp"
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
                logo.moveable[turtle] = args[0];
            }
        }
    }

    class ModeLengthBlock extends ValueBlock {
        constructor() {
            //.TRANS:  mode length is the number of notes in the mode, e.g., 7 for major and minor scales; 12 for chromatic scales
            super("modelength", _("mode length"));
            this.setPalette("intervals");
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Mode length block is the number of notes in the current scale."
                ) +
                    " " +
                    _("Most Western scales have 7 notes."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "modelength"]);
            } else {
                return getModeLength(logo.keySignature[turtle]);
            }
        }
    }

    class CurrentModeBlock extends ValueBlock {
        constructor() {
            //.TRANS: the mode in music is 'major', 'minor', etc.
            super("currentmode", _("current mode"));
            this.setPalette("intervals");
            this.parameter = true;
            this.setHelpString();
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "currentmode"]);
            } else {
                let obj = logo.keySignature[turtle].split(" ");
                return obj[1];
            }
        }
    }

    class KeyBlock extends ValueBlock {
        constructor() {
            //.TRANS: the key is a group of pitches with which a music composition is created
            super("key", _("current key"));
            this.setPalette("intervals");
            this.parameter = true;
            this.setHelpString();
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "key"]);
            } else {
                return logo.keySignature[turtle].split(' ')[0];
            }
        }
    }

    class SetKeyBlock extends FlowBlock {
        constructor() {
            super("setkey", _("set key"));
            this.setPalette("intervals");
            this.beginnerBlock(true);

            this.setHelpString();

            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: ["C"]
            });
            this.hidden = true;
            this.deprecated = true;
        }

        flow(args, logo, turtle) {
            if (args.length === 1) {
                logo.keySignature[turtle] = args[0];
            }
        }
    }

    class SetKey2Block extends FlowBlock {
        constructor() {
            //.TRANS: set the key and mode, e.g. C Major
            super("setkey2", _("set key"));
            this.setPalette("intervals");
            this.beginnerBlock(true);

            if (beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _("The Set key block is used to set the key and mode,"),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Set key block is used to set the key and mode,") +
                        " " +
                        _("eg C Major"),
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
                let modename = "major";
                for (let mode in MUSICALMODES) {
                    if (mode === args[1] || _(mode) === args[1]) {
                        modename = mode;
                        logo._modeBlock =
                            logo.blocks.blockList[blk].connections[2];
                        break;
                    }
                }

                let tur = logo.turtles.ithTurtle(turtle);
                // Check to see if there are any transpositions on the key
                if (tur.singer.transposition !== 0) {
                    let noteObj = getNote(
                        args[0],
                        4,
                        tur.singer.transposition,
                        logo.keySignature[turtle],
                        false,
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    logo.keySignature[turtle] = noteObj[0] + " " + modename;
                    logo.notation.notationKey(turtle, noteObj[0], modename);
                } else {
                    logo.keySignature[turtle] = args[0] + " " + modename;
                    logo.notation.notationKey(turtle, args[0], modename);
                }

                if (logo.insideModeWidget) {
                    // Ensure logo the mode for Turtle 0 is set, since it
                    // is used by the mode widget.
                    logo.keySignature[0] = args[0] + " " + modename;
                    logo.notation.notationKey(0, args[0], modename);
                }
            }
        }
    }

    new SetTemperamentBlock().setup();
    new TemperamentNameBlock().setup();
    new ModeNameBlock().setup();
    new DoublyBlock().setup();
    new IntervalNameBlock().setup();
    new MeasureIntervalSemitonesBlock().setup();
    new MeasureIntervalScalarBlock().setup();
    makeSemitoneIntervalMacroBlocks();
    new PerfectBlock().setup();
    new SemitoneIntervalBlock().setup();
    // makeIntervalMacroBlocks();
    new ScalarIntervalBlock().setup();
    new DefineModeBlock().setup();
    new MoveableBlock().setup();
    new ModeLengthBlock().setup();
    new CurrentModeBlock().setup();
    new KeyBlock().setup();
    new SetKeyBlock().setup();
    new SetKey2Block().setup();
}
