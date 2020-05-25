function setupMeterBlocks() {
    class CurrentMeterBlock extends ValueBlock {
        constructor() {
            //.TRANS: musical meter, e.g., 4:4
            super("currentmeter", _("current meter"));
            this.setPalette("meter");
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
                logo.statusFields.push([blk, "currentmeter"]);
            } else {
                return (
                    logo.beatsPerMeasure[turtle] +
                    ":" +
                    logo.noteValuePerBeat[turtle]
                );
            }
        }
    }

    class BeatFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: number of beats per minute
            super("beatfactor", _("beat factor"));
            this.setPalette("meter");
            this.parameter = true;
            this.setHelpString();
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        setter(logo, value, turtle, blk) {
            logo.beatFactor[turtle] = value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "beatfactor"]);
            } else {
                return logo.beatFactor[turtle];
            }
        }
    }

    class BPMFactorBlock extends ValueBlock {
        constructor() {
            super("bpmfactor");
            this.setPalette("meter");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Beats per minute block returns the current beats per minute."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: number of beats played per minute
                name:
                    this.lang === "ja"
                        ? _("beats per minute2")
                        : _("beats per minute")
            });
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        setter(logo, value, turtle, blk) {
            let len = logo.bpm[turtle].length;
            if (len > 0) {
                logo.bpm[turtle][len - 1] = value;
            } else {
                logo.bpm[turtle].push(value);
            }
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "bpm"]);
            } else if (logo.bpm[turtle].length > 0) {
                return last(logo.bpm[turtle]);
            } else {
                return logo._masterBPM;
            }
        }
    }

    class MeasureValueBlock extends ValueBlock {
        constructor() {
            //.TRANS: count of current measure in meter
            super("measurevalue", _("measure count"));
            this.setPalette("meter");
            this.parameter = true;
            this.setHelpString([
                _("The Measure count block returns the current measure."),
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
                logo.statusFields.push([blk, "measurevalue"]);
            } else {
                if (
                    logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1] <
                    logo.pickup[turtle]
                ) {
                    return 0;
                } else {
                    return (
                        Math.floor(
                            ((logo.notesPlayed[turtle][0] /
                                logo.notesPlayed[turtle][1] -
                                logo.pickup[turtle]) *
                                logo.noteValuePerBeat[turtle]) /
                                logo.beatsPerMeasure[turtle]
                        ) + 1
                    );
                }
            }
        }
    }

    class BeatValueBlock extends ValueBlock {
        constructor() {
            //.TRANS: count of current beat in meter
            super("beatvalue", _("beat count"));
            this.setPalette("meter");
            this.beginnerBlock(true);
            this.parameter = true;
            if (beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "The Beat count block is the number of the current beat,"
                    ) +
                        " " +
                        _(
                            "In the figure, it is used to take an action on the first beat of each measure."
                        ),
                    "documentation",
                    null,
                    "everybeathelp"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Beat count block is the number of the current beat,"
                    ) +
                        " " +
                        _("eg 1, 2, 3, or 4.") +
                        " " +
                        _(
                            "In the figure, it is used to take an action on the first beat of each measure."
                        ),
                    "documentation",
                    null,
                    "beatvaluehelp"
                ]);
            }
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
                logo.statusFields.push([blk, "beatvalue"]);
            } else {
                if (
                    logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1] <
                    logo.pickup[turtle]
                ) {
                    return 0;
                } else {
                    return (
                        (((logo.notesPlayed[turtle][0] /
                            logo.notesPlayed[turtle][1] -
                            logo.pickup[turtle]) *
                            logo.noteValuePerBeat[turtle]) %
                            logo.beatsPerMeasure[turtle]) +
                        1
                    );
                }
            }
        }
    }

    class NoteCounterBlock extends LeftBlock {
        constructor() {
            //.TRANS: count the number of notes
            super("notecounter", _("sum note values"));
            this.setPalette("meter");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Note counter block can be used to count the number of contained notes."
                ),
                "documentation",
                null,
                "notecounterhelp"
            ]);
            this.formBlock({
                flows: {
                    labels: [""],
                    type: "flow"
                }
            });
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                return logo._noteCounter(turtle, cblk);
            }
        }
    }

    class ElapsedNotesBlock extends ValueBlock {
        constructor() {
            //.TRANS: number of whole notes that have been played
            super("elapsednotes", _("whole notes played"));
            this.setPalette("meter");
            this.parameter = true;
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Whole notes played block returns the total number of whole notes played."
                ),
                "documentation",
                null,
                "elapsedhelp"
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
                logo.statusFields.push([blk, "elapsednotes"]);
            } else {
                return (
                    logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1]
                );
            }
        }
    }

    class ElapsedNotes2Block extends LeftBlock {
        constructor() {
            //.TRANS: number of notes that have been played
            super("elapsednotes2", _("notes played"));
            this.setPalette("meter");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Notes played block is the number of notes that have been played."
                ) +
                    " " +
                    _("(By default, it counts quarter notes.)"),
                "documentation",
                null,
                "everybeathelp"
            ]);
            this.parameter = true;
            this.formBlock({
                args: 1
            });

            this.makeMacro((x, y) => [
                [0, "elapsednotes2", x, y, [null, 1]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]]
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "elapsednotes2"]);
            } else {
                let cblk = logo.blocks.blockList[blk].connections[1];
                let notevalue = logo.parseArg(
                    logo,
                    turtle,
                    cblk,
                    blk,
                    receivedArg
                );
                if (notevalue === null || notevalue === 0) {
                    return 0;
                } else {
                    return (
                        logo.notesPlayed[turtle][0] /
                        logo.notesPlayed[turtle][1] /
                        notevalue
                    );
                }
            }
        }
    }

    class DriftBlock extends FlowClampBlock {
        constructor() {
            super("drift");
            this.setPalette("meter");
            this.setHelpString([
                _(
                    "The No clock block decouples the notes from the master clock."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: don't lock notes to master clock
                name: _("no clock")
            });
            this.makeMacro((x, y) => [
                [0, "drift", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined)
                // Nothing to do.
                return;

            logo.drift[turtle] += 1;

            let listenerName = "_drift_" + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            let __listener = function(event) {
		if (logo.drift[turtle] > 0) {
                    logo.drift[turtle] -= 1;
		}
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class OffBeatDoBlock extends FlowBlock {
        constructor() {
            // .TRANS: on musical 'offbeat' do some action
            super("offbeatdo", _("on weak beat do"));
            this.setPalette("meter");
            this.setHelpString([
                _(
                    "The On-weak-beat block let you specify actions to take on weak (off) beats."
                ),
                "documentation",
                null,
                "everybeathelp"
            ]);
            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: [_("action")]
            });
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            // Set up a listener for this turtle/offbeat combo.
            if (!(args[0] in logo.actions)) {
                logo.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                let __listener = function(event) {
                    if (logo.turtles.turtleList[turtle].running) {
                        let queueBlock = new Queue(
                            logo.actions[args[0]],
                            1,
                            blk
                        );
                        logo.parentFlowQueue[turtle].push(blk);
                        logo.turtles.turtleList[turtle].queue.push(queueBlock);
                    } else {
                        // Since the turtle has stopped
                        // running, we need to run the stack
                        // from here.
                        if (isflow) {
                            logo._runFromBlockNow(
                                logo,
                                turtle,
                                logo.actions[args[0]],
                                isflow,
                                receivedArg
                            );
                        } else {
                            logo._runFromBlock(
                                logo,
                                turtle,
                                logo.actions[args[0]],
                                isflow,
                                receivedArg
                            );
                        }
                    }
                };

                let eventName = "__offbeat_" + turtle + "__";
                logo._setListener(turtle, eventName, __listener);

                logo.beatList[turtle].push("offbeat");
            }
        }
    }

    class OnBeatDoBlock extends FlowBlock {
        constructor() {
            // .TRANS: 'on' musical 'beat' 'do' some action
            super("onbeatdo", _("on strong beat"));
            this.setPalette("meter");
            this.setHelpString([
                _(
                    "The On-strong-beat block let you specify actions to take on specified beats."
                ),
                "documentation",
                null,
                "everybeathelp"
            ]);
            this.formBlock({
                args: 2,
                argTypes: ["numberin", "textin"],
                defaults: [1, _("action")],
                //.TRANS: do1 is do (take) an action (JAPANESE ONLY)
                argLabels: [_("beat"), this.lang === "ja" ? _("do1") : _("do")]
            });
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            // Set up a listener for this turtle/onbeat combo.
            if (args.length === 2) {
                if (!(args[1] in logo.actions)) {
                    logo.errorMsg(NOACTIONERRORMSG, blk, args[1]);
                } else {
                    let __listener = function(event) {
                        if (logo.turtles.turtleList[turtle].running) {
                            let queueBlock = new Queue(
                                logo.actions[args[1]],
                                1,
                                blk
                            );
                            logo.parentFlowQueue[turtle].push(blk);
                            logo.turtles.turtleList[turtle].queue.push(
                                queueBlock
                            );
                        } else {
                            // Since the turtle has stopped
                            // running, we need to run the stack
                            // from here.
                            if (isflow) {
                                logo._runFromBlockNow(
                                    logo,
                                    turtle,
                                    logo.actions[args[1]],
                                    isflow,
                                    receivedArg
                                );
                            } else {
                                logo._runFromBlock(
                                    logo,
                                    turtle,
                                    logo.actions[args[1]],
                                    isflow,
                                    receivedArg
                                );
                            }
                        }
                    };

                    let eventName = "__beat_" + args[0] + "_" + turtle + "__";
                    logo._setListener(turtle, eventName, __listener);

                    //remove any default strong beats other than "everybeat " or  "offbeat"
                    if (logo.defaultStrongBeats[turtle]) { 
                        for (let i = 0; i < logo.beatList[turtle].length; i++) {
                            if (logo.beatList[turtle][i] !== "everybeat" && logo.beatList[turtle][i] !== "offbeat") {
                                logo.beatList[turtle].splice(i, 1);
                                i--;
                            }
                        }
                        logo.defaultStrongBeats[turtle] = false;
                    }

                    if (args[0] > logo.beatsPerMeasure[turtle]) {
                        logo.factorList[turtle].push(args[0]);
                    } else {
                        logo.beatList[turtle].push(args[0]);
                    }
                }
            }
        }
    }

    class EveryBeatDoBlock extends FlowBlock {
        constructor() {
            // .TRANS: on every note played, do some action
            super("everybeatdo", _("on every note do"));
            this.setPalette("meter");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The On-every-note block let you specify actions to take on every note."
                ),
                "documentation",
                null,
                "everybeathelp"
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: [_("action")]
            });
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            // Set up a listener for every beat for this turtle.
            if (!(args[0] in logo.actions)) {
                logo.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                let __listener = function(event) {
                    if (logo.turtles.turtleList[turtle].running) {
                        let queueBlock = new Queue(
                            logo.actions[args[0]],
                            1,
                            blk
                        );
                        logo.parentFlowQueue[turtle].push(blk);
                        logo.turtles.turtleList[turtle].queue.push(queueBlock);
                    } else {
                        // Since the turtle has stopped
                        // running, we need to run the stack
                        // from here.
                        if (isflow) {
                            logo._runFromBlockNow(
                                logo,
                                turtle,
                                logo.actions[args[0]],
                                isflow,
                                receivedArg
                            );
                        } else {
                            logo._runFromBlock(
                                logo,
                                turtle,
                                logo.actions[args[0]],
                                isflow,
                                receivedArg
                            );
                        }
                    }
                };

                let eventName = "__everybeat_" + turtle + "__";
                logo._setListener(turtle, eventName, __listener);

                logo.beatList[turtle].push("everybeat");
            }
        }
    }

    class SetMasterBPM2Block extends FlowBlock {
        constructor() {
            //.TRANS: sets tempo by defniing a beat and beats per minute
            super("setmasterbpm2", _("master beats per minute"));
            this.setPalette("meter");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Master beats per minute block sets the number of 1/4 notes per minute for every voice."
                ),
                "documentation",
                null,
                "setmasterbpm2"
            ]);

            this.formBlock({
                args: 2,
                defaults: [90, 1 / 4],
                argLabels: [_("bpm"), _("beat value")]
            });
            this.makeMacro((x, y) => [
                [0, "setmasterbpm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (
                args.length === 2 &&
                typeof args[0] === "number" &&
                typeof args[1] === "number"
            ) {
                let bpm = (args[0] * args[1]) / 0.25;
                let obj, target;
                if (bpm < 30) {
                    obj = rationalToFraction(args[1]);
                    target = (30 * 0.25) / args[1];
                    logo.errorMsg(
                        obj[0] +
                            "/" +
                            obj[1] +
                            " " +
                            _("beats per minute must be greater than") +
                            " " +
                            target,
                        blk
                    );
                    logo._masterBPM = 30;
                } else if (bpm > 1000) {
                    obj = rationalToFraction(args[1]);
                    target = (1000 * 0.25) / args[1];
                    logo.errorMsg(
                        _("maximum") +
                            " " +
                            obj[0] +
                            "/" +
                            obj[1] +
                            " " +
                            _("beats per minute is") +
                            " " +
                            target,
                        blk
                    );
                    logo._masterBPM = 1000;
                } else {
                    logo._masterBPM = bpm;
                }

                logo.notationTempo(turtle, args[0], args[1]);
                logo.defaultBPMFactor = TONEBPM / logo._masterBPM;
            }

            if (logo.inTempo) {
                logo.tempo.BPMBlocks.push(blk);
                let bpmnumberblock = logo.blocks.blockList[blk].connections[1];
                logo.tempo.BPMs.push(
                    logo.blocks.blockList[bpmnumberblock].text.text
                );
            }
        }
    }

    class SetMasterBPMBlock extends FlowBlock {
        constructor() {
            //.TRANS: old block to set master tempo which doesn't set value of beat
            super("setmasterbpm", _("master beats per minute"));
            this.setPalette("meter");
            this.setHelpString();
            this.formBlock({
                args: 1,
                defaults: [90]
            });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 1 && typeof args[0] === "number") {
                if (args[0] < 30) {
                    logo.errorMsg(_("Beats per minute must be > 30."), blk);
                    logo._masterBPM = 30;
                } else if (args[0] > 1000) {
                    logo.errorMsg(_("Maximum beats per minute is 1000."), blk);
                    logo._masterBPM = 1000;
                } else {
                    logo._masterBPM = args[0];
                }

                logo.defaultBPMFactor = TONEBPM / logo._masterBPM;
            }

            if (logo.inTempo) {
                logo.tempo.BPMBlocks.push(blk);
                let bpmnumberblock = logo.blocks.blockList[blk].connections[1];
                logo.tempo.BPMs.push(
                    logo.blocks.blockList[bpmnumberblock].text.text
                );
            }
        }
    }

    class SetBPM3Block extends FlowBlock {
        constructor() {
            //.TRANS: sets tempo by defniing a beat and beats per minute
            super("setbpm3", _("beats per minute"));
            this.setPalette("meter");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Beats per minute block sets the number of 1/4 notes per minute."
                ),
                "documentation",
                null,
                "bpmhelp"
            ]);

            this.formBlock({
                args: 2,
                defaults: [90, 1 / 4],
                argLabels: [_("bpm"), _("beat value")]
            });
            this.makeMacro((x, y) => [
                [0, "setbpm3", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (
                args.length === 2 &&
                typeof args[0] === "number" &&
                typeof args[1] === "number"
            ) {
                let bpm = (args[0] * args[1]) / 0.25;
                let obj, target;
                if (bpm < 30) {
                    obj = rationalToFraction(args[1]);
                    target = (30 * 0.25) / args[1];
                    logo.errorMsg(
                        obj[0] +
                            "/" +
                            obj[1] +
                            " " +
                            _("beats per minute must be greater than") +
                            " " +
                            target,
                        blk
                    );
                    bpm = 30;
                } else if (bpm > 1000) {
                    obj = rationalToFraction(args[1]);
                    target = (1000 * 0.25) / args[1];
                    logo.errorMsg(
                        _("maximum") +
                            " " +
                            obj[0] +
                            "/" +
                            obj[1] +
                            " " +
                            _("beats per minute is") +
                            " " +
                            target,
                        blk
                    );
                    bpm = 1000;
                } else {
                    bpm = bpm;
                }

                logo.notationTempo(turtle, args[0], args[1]);
                logo.bpm[turtle].push(bpm);
            }

            if (logo.inTempo) {
                logo.tempo.BPMBlocks.push(blk);
                let bpmnumberblock = logo.blocks.blockList[blk].connections[1];
                logo.tempo.BPMs.push(
                    logo.blocks.blockList[bpmnumberblock].text.text
                );
            }
        }
    }

    class SetBPM2Block extends FlowClampBlock {
        constructor() {
            super("setbpm2");
            this.setPalette("meter");
            this.setHelpString();

            this.formBlock({
                // .TRANS: sets tempo for notes contained in block
                name: _("beats per minute"),
                args: 2,
                argLabels: [_("bpm"), _("beat value")],
                defaults: [90, 1 / 4]
            });
            this.makeMacro((x, y) => [
                [0, "setbpm2", x, y, [null, 1, 3, 2, 6]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "vspace", 0, 0, [0, null]],
                [3, "divide", 0, 0, [0, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 4 }], 0, 0, [3]],
                [6, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (
                args.length === 3 &&
                typeof args[0] === "number" &&
                typeof args[1] == "number"
            ) {
                let bpm = (args[0] * args[1]) / 0.25;
                if (args[0] < 30) {
                    logo.errorMsg(_("Beats per minute must be > 30."));
                    bpm = 30;
                } else if (args[0] > 1000) {
                    logo.errorMsg(_("Maximum beats per minute is 1000."));
                    bpm = 1000;
                }

                logo.notationTempo(turtle, args[0], args[1]);
                logo.bpm[turtle].push(bpm);

                let listenerName = "_bpm_" + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                let __listener = function(event) {
                    logo.bpm[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);

                return [args[2], 1];
            }
        }
    }

    class SetBPMBlock extends FlowClampBlock {
        constructor() {
            super("setbpm");
            this.setPalette("meter");
            this.setHelpString();

            this.formBlock({
                // .TRANS: old block to set tempo using only bpm for notes contained in block
                name: _("beats per minute"),
                args: 1,
                defaults: [90]
            });
            this.makeMacro((x, y) => [
                [0, "setbpm", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args.length === 2 && typeof args[0] === "number") {
                let bpm;
                if (args[0] < 30) {
                    logo.errorMsg(_("Beats per minute must be > 30."), blk);
                    bpm = 30;
                } else if (args[0] > 1000) {
                    logo.errorMsg(_("Maximum beats per minute is 1000."), blk);
                    bpm = 1000;
                } else {
                    bpm = args[0];
                }

                logo.bpm[turtle].push(bpm);

                let listenerName = "_bpm_" + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                let __listener = function(event) {
                    logo.bpm[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);

                return [args[1], 1];
            }
        }
    }

    class PickupBlock extends FlowBlock {
        constructor() {
            //.TRANS: anacrusis
            super("pickup", _("pickup"));
            this.setPalette("meter");
            this.setHelpString([
                _(
                    "The Pickup block is used to accommodate any notes that come in before the beat."
                ),
                "documentation",
                null,
                "pickup"
            ]);
            this.extraWidth = 15;
            this.formBlock({
                args: 1,
                defaults: [0]
            });
            this.makeMacro((x, y) => [
                [0, "pickup", x, y, [null, 1, 4]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 0 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let arg0;
            if (args.length !== 1 || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            } else {
                arg0 = args[0];
            }

            if (arg0 < 0) {
                logo.pickup[turtle] = 0;
            } else {
                logo.pickup[turtle] = arg0;
            }

            logo.notationPickup(turtle, logo.pickup[turtle]);
        }
    }

    class MeterBlock extends FlowBlock {
        constructor() {
            //.TRANS: musical meter (time signature)
            super("meter", _("meter"));
            this.setPalette("meter");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The beat of the music is determined by the Meter block (by default, 4 1/4 notes per measure)."
                ),
                "documentation",
                null,
                "meter"
            ]);

            this.extraWidth = 15;
            this.formBlock({
                args: 2,
                defaults: [4, 1 / 4],
                argLabels: [_("number of beats"), _("note value")]
            });
            this.makeMacro((x, y) => [
                [0, "meter", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 4 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let arg0, arg1;
            if (args[0] === null || typeof args[0] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = 4;
            } else arg0 = args[0];

            if (logo.insideMeterWidget) logo._meterBlock = blk;

            if (args[1] === null || typeof args[1] !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 1 / 4;
            } else arg1 = args[1];

            if (arg0 <= 0) logo.beatsPerMeasure[turtle] = 4;
            else logo.beatsPerMeasure[turtle] = arg0;

            if (arg1 <= 0) logo.noteValuePerBeat[turtle] = 4;
            else logo.noteValuePerBeat[turtle] = 1 / arg1;

            // setup default strong / weak beats until any strong beat block is used 

            if (logo.noteValuePerBeat[turtle] == 4 && logo.beatsPerMeasure[turtle] == 4) {
                logo.beatList[turtle].push(1);
                logo.beatList[turtle].push(3);
                logo.defaultStrongBeats[turtle] = true;
            }
            else if (logo.noteValuePerBeat[turtle] == 4 && logo.beatsPerMeasure[turtle] == 2) {
                logo.beatList[turtle].push(1);
                logo.defaultStrongBeats[turtle] = true;
            }
            else if (logo.noteValuePerBeat[turtle] == 4 && logo.beatsPerMeasure[turtle] == 3) {
                logo.beatList[turtle].push(1);
                logo.defaultStrongBeats[turtle] = true;
            }
            else if (logo.noteValuePerBeat[turtle] == 8 && logo.beatsPerMeasure[turtle] == 6) {
                logo.beatList[turtle].push(1);
                logo.beatList[turtle].push(4);
                logo.defaultStrongBeats[turtle] = true;
            }

            

            logo.notationMeter(
                turtle,
                logo.beatsPerMeasure[turtle],
                logo.noteValuePerBeat[turtle]
            );
        }
    }

    new CurrentMeterBlock().setup();
    new BeatFactorBlock().setup();
    new BPMFactorBlock().setup();
    new MeasureValueBlock().setup();
    new BeatValueBlock().setup();
    new NoteCounterBlock().setup();
    new ElapsedNotesBlock().setup();
    new ElapsedNotes2Block().setup();
    new DriftBlock().setup();
    new OffBeatDoBlock().setup();
    new OnBeatDoBlock().setup();
    new EveryBeatDoBlock().setup();
    new SetMasterBPM2Block().setup();
    new SetMasterBPMBlock().setup();
    new SetBPM3Block().setup();
    new SetBPM2Block().setup();
    new SetBPMBlock().setup();
    new PickupBlock().setup();
    new MeterBlock().setup();
}
