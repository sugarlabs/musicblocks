/**
 * The target-turtle name can be a string or an int. Makes sure there is a turtle by this name and then finds the associated start block.
 * @param   turtles instance
 * @param   {number|string} targetTurtle
 * @returns {number|object}
 */
function _getTargetTurtle(turtles, targetTurtle) {
    // We'll compare the names as strings.
    if (typeof targetTurtle === "number") {
        targetTurtle = targetTurtle.toString();
    }

    for (let i = 0; i < turtles.turtleList.length; i++) {
        if (!turtles.turtleList[i].inTrash) {
            let turtleName = turtles.turtleList[i].name;
            if (typeof turtleName === "number") {
                turtleName = turtleName.toString();
            }

            if (turtleName === targetTurtle) {
                return i;
            }
        }
    }

    console.log(targetTurtle + " not found");
    console.log(turtles.turtleList);
    return null;
}

function _blockFindTurtle(logo, turtle, blk, receivedArg) {
    let cblk = logo.blocks.blockList[blk].connections[1];
    if (cblk === null) {
        console.log("Could not find connecting block");
        return null;
    }
    let targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
    if (targetTurtle === null) {
        console.log("Could not find target turtle name from arg");
        return null;
    }
    return logo.turtles.turtleList[
        _getTargetTurtle(logo.turtles, targetTurtle)
    ];
}

function setupEnsembleBlocks() {
    class TurtleHeapBlock extends LeftBlock {
        constructor() {
            super("turtleheap", _("mouse index heap"));
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The Mouse index heap block returns a value in the heap at a specified location for a specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 2,
                defaults: [_("Mr. Mouse"), 1],
                argTypes: ["anyin", "numberin"],
                argLabels: [_("mouse name"), _("index")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
		return -1;
	    }

	    let targetTurtle = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
	    let i = _getTargetTurtle(logo.turtles, targetTurtle);
	    if (i < 0) return -1;

            let cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk2 === null) {
                logo.errorMsg(NANERRORMSG, blk);
            } else {
                let a = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                if (typeof a === "number") {
                    if (!(i in logo.turtleHeaps)) {
                        logo.turtleHeaps[i] = [];
                    }

                    if (a < 1) {
                        a = 1;
                        logo.errorMsg(_("Index must be > 0."));
                    }

                    if (a > 1000) {
                        a = 1000;
                        logo.errorMsg(_("Maximum heap size is 1000."));
                    }

                    // If index > heap length, grow the heap.
                    while (logo.turtleHeaps[i].length < a) {
                        logo.turtleHeaps[i].push(0);
                    }
                    return logo.turtleHeaps[i][a - 1];
                } else {
                    logo.errorMsg(NANERRORMSG, blk);
                }
            }
        }
    }

    class StopTurtleBlock extends FlowBlock {
        constructor() {
            super("stopTurtle", _("stop mouse"));
            this.setPalette("ensemble");
            this.setHelpString([
                _("The Stop mouse block stops the specified mouse."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [_("Mr. Mouse")],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let targetTurtle = _getTargetTurtle(logo.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    logo.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                logo.turtles.turtleList[targetTurtle].queue = [];
                logo.parentFlowQueue[targetTurtle] = [];
                logo.unhighlightQueue[targetTurtle] = [];
                logo.parameterQueue[targetTurtle] = [];
                console.debug("stopping " + targetTurtle);
                logo.turtles.turtleList[turtle].running = false;
                logo.doBreak(targetTurtle);
            }
        }
    }

    class StartTurtleBlock extends FlowBlock {
        constructor() {
            super("startTurtle", _("start mouse"));
            this.setPalette("ensemble");
            this.setHelpString([
                _("The Start mouse block starts the specified mouse."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [_("Mr. Mouse")],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
	    console.log('start mouse from mouse ' + turtle);
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let targetTurtle = _getTargetTurtle(logo.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    logo.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                if (logo.turtles.turtleList[targetTurtle].running) {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        logo.errorMsg(_("Mouse is already running."), blk);
                    } else {
                        logo.errorMsg(_("Turtle is already running."), blk);
                    }
                    return;
                }
                logo.turtles.turtleList[targetTurtle].queue = [];
                logo.turtles.turtleList[targetTurtle].running = true;
                logo.parentFlowQueue[targetTurtle] = [];
                logo.unhighlightQueue[targetTurtle] = [];
                logo.parameterQueue[targetTurtle] = [];
                // Find the start block associated with this turtle.
                let foundStartBlock = false;
                let startBlk = null;
                for (let i = 0; i < logo.blocks.blockList.length; i++) {
                    if (
                        logo.blocks.blockList[i] ===
                        logo.turtles.turtleList[targetTurtle].startBlock
                    ) {
                        foundStartBlock = true;
                        startBlk = i;
                        break;
                    }
                }
                if (foundStartBlock) {
                    console.debug("STARTING " + targetTurtle + " " + startBlk);
                    logo.runFromBlock(
                        logo,
                        targetTurtle,
                        startBlk,
                        isflow,
                        receivedArg
                    );
                } else {
                    logo.errorMsg(
                        _("Cannot find start block") + " " + args[0],
                        blk
                    );
                }
            }
        }
    }

    class TurtleColorBlock extends LeftBlock {
        constructor() {
            //.TRANS: pen color for this mouse
            super("turtlecolor", _("mouse color"));
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The Mouse color block returns the pen color of the specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(logo, turtle, blk, receivedArg);

            if (thisTurtle) return thisTurtle.painter.color;
            return logo.turtles.turtleList[turtle].painter.color;
        }
    }

    class TurtleHeadingBlock extends LeftBlock {
        constructor() {
            //.TRANS: heading (compass direction) for this mouse
            super("turtleheading", _("mouse heading"));
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The Mouse heading block returns the heading of the specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(logo, turtle, blk, receivedArg);

            if (thisTurtle) return thisTurtle.orientation;
            return logo.turtles.turtleList[turtle].orientation;
        }
    }

    class SetXYTurtleBlock extends FlowBlock {
        constructor() {
            //.TRANS: set xy position for this mouse
            super("setxyturtle", _("set mouse"));
            this.setPalette("ensemble");
            this.setHelpString();

            this.formBlock({
                args: 3,
                defaults: [_("Mr. Mouse"), 0, 0],
                argTypes: ["anyin", "numberin", "numberin"],
                argLabels: [
                    this.lang === "ja" ? _("name1") : _("name"),
                    _("x"),
                    _("y")
                ]
            });
            this.hidden = true;
        }

        // deprecated
        flow(args, logo, turtle, blk) {
            let targetTurtle = _getTargetTurtle(logo.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    logo.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else if (args.length === 3) {
                if (
                    typeof args[1] === "string" ||
                    typeof args[2] === "string"
                ) {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.turtles.turtleList[targetTurtle].painter.doSetXY(
                        args[1],
                        args[2]
                    );
                }
            }
        }
    }

    class SetTurtleBlock extends FlowClampBlock {
        constructor() {
            super("setturtle");
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The Set mouse block sends a stack of blocks to be run by the specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("set mouse"),
                args: 1,
                defaults: [_("Mr. Mouse")],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            let targetTurtle = _getTargetTurtle(logo.turtles, args[0]);
            if (targetTurtle !== null) {
                logo.runFromBlock(
                    logo,
                    targetTurtle,
                    args[1],
                    isflow,
                    receivedArg
                );
            } else {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    logo.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            }
        }
    }

    class YTurtleBlock extends LeftBlock {
        constructor() {
            //.TRANS: y position for this mouse
            super("yturtle", _("mouse y"));
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The Y mouse block returns the Y position of the specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(logo, turtle, blk, receivedArg);

            if (thisTurtle)
                return logo.turtles.screenY2turtleY(thisTurtle.container.y);
            thisTurtle = logo.turtles.turtleList[turtle];
            console.log("Mouse not found. Using current mouse value instead.");
            return logo.turtles.screenY2turtleY(thisTurtle.container.y);
        }
    }

    class XTurtleBlock extends LeftBlock {
        constructor() {
            //.TRANS: x position for this mouse
            super("xturtle", _("mouse x"));
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The X mouse block returns the X position of the specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(logo, turtle, blk, receivedArg);

            if (thisTurtle)
                return logo.turtles.screenX2turtleX(thisTurtle.container.x);

            thisTurtle = logo.turtles.turtleList[turtle];
            console.log("Mouse not found. Using current mouse value instead.");
            return logo.turtles.screenX2turtleX(thisTurtle.container.x);
        }
    }

    class TurtleElapsedNotesBlock extends LeftBlock {
        constructor() {
            //.TRANS: notes played by this mouse
            super("turtleelapsednotes", _("mouse notes played"));
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The Mouse elapse notes block returns the number of notes played by the specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(logo, turtle, blk, receivedArg);

            if (thisTurtle)
                return logo.notesPlayed[i][0] / logo.notesPlayed[i][1];

            return logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1];
        }
    }

    class TurtlePitchBlock extends LeftBlock {
        constructor() {
            //.TRANS: convert current note for this turtle to piano key (1-88)
            super("turtlepitch", _("mouse pitch number"));
            this.setPalette("ensemble");
            this.setHelpString([
                _(
                    "The Mouse pitch block returns the current pitch number being played by the specified mouse."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let value = null;
            let cblk = logo.blocks.blockList[blk].connections[1];
            let targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            let tur = logo.turtles.ithTurtle(turtle);

            for (let i = 0; i < logo.turtles.turtleList.length; i++) {
                let thisTurtle = logo.turtles.turtleList[i];
                if (targetTurtle === thisTurtle.name) {
                    let obj;
                    if (thisTurtle.singer.lastNotePlayed !== null) {
                        let len = thisTurtle.singer.lastNotePlayed[0].length;
                        let pitch = thisTurtle.singer.lastNotePlayed[0].slice(0, len - 1);
                        let octave = parseInt(thisTurtle.singer.lastNotePlayed[0].slice(len - 1));

                        obj = [pitch, octave];
                    } else if (thisTurtle.singer.notePitches.length > 0) {
                        obj = getNote(
                            thisTurtle.singer.notePitches[0],
                            thisTurtle.singer.noteOctaves[0],
                            0,
                            logo.keySignature[i],
                            logo.moveable[turtle],
                            null,
                            logo.errorMsg,
                            logo.synth.inTemperament
                        );
                    } else {
                        console.debug("Cannot find a note for mouse " + turtle);
                        logo.errorMsg(INVALIDPITCH, blk);
                        obj = ["G", 4];
                    }

                    value =
                        pitchToNumber(obj[0], obj[1], logo.keySignature[i]) -
                        tur.singer.pitchNumberOffset;
                    logo.blocks.blockList[blk].value = value;
                    break;
                }
            }

            if (value === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(
                        _("Cannot find mouse") + " " + targetTurtle,
                        blk
                    );
                } else {
                    logo.errorMsg(
                        _("Cannot find turtle") + " " + targetTurtle,
                        blk
                    );
                }

                let obj;
                if (tur.singer.lastNotePlayed !== null) {
                    let len = tur.singer.lastNotePlayed[0].length;
                    let pitch = tur.singer.lastNotePlayed[0].slice(0, len - 1);
                    let octave = parseInt(tur.singer.lastNotePlayed[0].slice(len - 1));
                    obj = [pitch, octave];
                } else if (tur.singer.notePitches.length > 0) {
                    obj = getNote(
                        tur.singer.notePitches[last(logo.inNoteBlock[turtle])][0],
                        tur.singer.noteOctaves[last(logo.inNoteBlock[turtle])][0],
                        0,
                        logo.keySignature[turtle],
                        logo.moveable[turtle],
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                } else {
                    console.debug("Cannot find a note for mouse " + turtle);
                    logo.errorMsg(INVALIDPITCH, blk);
                    obj = ["G", 4];
                }

                value =
                    pitchToNumber(obj[0], obj[1], logo.keySignature[turtle]) -
                    tur.singer.pitchNumberOffset;
                logo.blocks.blockList[blk].value = value;
            }
        }
    }

    class TurtleNoteBlock extends LeftBlock {
        constructor(name, displayName) {
            super(name || "turtlenote", displayName || _("mouse note value"));
            this.setPalette("ensemble");
            this.setHelpString();

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
            this.hidden = true;
        }

        arg(logo, turtle, blk, receivedArg) {
            let value = null;
            let cblk = logo.blocks.blockList[blk].connections[1];
            let targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            for (let i = 0; i < logo.turtles.turtleList.length; i++) {
                let thisTurtle = logo.turtles.ithTurtle(i);
                if (targetTurtle === thisTurtle.name) {
                    if (
                        logo.inNoteBlock[i].length > 0 &&
                        last(logo.inNoteBlock[i]) in thisTurtle.singer.noteValue
                    ) {
                        value = 1 / thisTurtle.singer.noteValue[last(logo.inNoteBlock[i])];
                    } else if (thisTurtle.singer.lastNotePlayed !== null) {
                        value = thisTurtle.singer.lastNotePlayed[1];
                    } else if (thisTurtle.singer.notePitches.length > 0) {
                        value = thisTurtle.singer.noteBeat[last(logo.inNoteBlock[i])];
                    } else {
                        value = -1;
                    }

                    if (logo.blocks.blockList[blk].name === "turtlenote") {
                        logo.blocks.blockList[blk].value = value;
                    } else if (value !== 0) {
                        logo.blocks.blockList[blk].value = 1 / value;
                    } else {
                        logo.blocks.blockList[blk].value = 0;
                    }
                    break;
                }
            }

            if (value === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(
                        _("Cannot find mouse") + " " + targetTurtle,
                        blk
                    );
                } else {
                    logo.errorMsg(
                        _("Cannot find turtle") + " " + targetTurtle,
                        blk
                    );
                }
                logo.blocks.blockList[blk].value = -1;
            }
        }
    }

    class TurtleNote2Block extends TurtleNoteBlock {
        constructor() {
            super("turtlenote2", _("mouse note value"));
            this.setHelpString([
                _(
                    "The Mouse note block returns the current note value being played by the specified mouse."
                ),
                "documentation",
                ""
            ]);
        }
    }

    class TurtleSyncBlock extends FlowBlock {
        constructor() {
            super("turtlesync", _("mouse sync"));
            this.setPalette("ensemble");
            this.setHelpString([
                _("The Mouse sync block aligns the beat count between mice."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let targetTurtle = _getTargetTurtle(logo.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    logo.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                logo.turtleTime[turtle] = logo.turtleTime[targetTurtle];
            }
        }
    }

    class FoundTurtleBlock extends BooleanBlock {
        constructor() {
            super("foundturtle");
            this.setPalette("ensemble");
	        // this.extraWidth = 20;
            this.setHelpString([
                _(
                    "The Found mouse block will return true if the specified mouse can be found."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("found mouse"),
                flows: {
                    left: "bool"
                },
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            let targetTurtle = logo.parseArg(
                logo,
                turtle,
                cblk,
                blk,
                receivedArg
            );
            return _getTargetTurtle(logo.turtles, targetTurtle) !== null;
        }
    }

    class NewTurtleBlock extends FlowBlock {
        constructor() {
            super("newturtle", _("new mouse"));
            this.setPalette("ensemble");
            this.setHelpString([
                _("The New mouse block will create a new mouse."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        flow(args, logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            let turtleName = logo.parseArg(
                logo,
                turtle,
                cblk,
                blk,
                receivedArg
            );
            if (_getTargetTurtle(logo.turtles, turtleName) === null) {
                let blockNumber = logo.blocks.blockList.length;

                let x = logo.turtles.turtleX2screenX(
                    logo.turtles.turtleList[turtle].x
                );
                let y = logo.turtles.turtleY2screenY(
                    logo.turtles.turtleList[turtle].y
                );

                let newBlock = [
                    [0, "start", x, y, [null, 1, null]],
                    [1, "setturtlename2", 0, 0, [0, 2, null]],
                    [2, ["text", { value: turtleName }], 0, 0, [1]]
                ];
                let __afterLoad = function() {
                    console.debug("AFTERLOAD");
                    let thisTurtle = logo.blocks.blockList[blockNumber].value;
                    logo.initTurtle(thisTurtle);
                    logo.turtles.turtleList[thisTurtle].queue = [];
                    logo.parentFlowQueue[thisTurtle] = [];
                    logo.unhighlightQueue[thisTurtle] = [];
                    logo.parameterQueue[thisTurtle] = [];
                    logo.turtles.turtleList[thisTurtle].running = true;
                    logo.runFromBlock(
                        logo,
                        thisTurtle,
                        blockNumber,
                        0,
                        receivedArg
                    );
                    // Dispatch an event to indicate logo this turtle
                    // is running.
                    logo.stage.dispatchEvent(turtleName);
                    document.removeEventListener(
                        "finishedLoading",
                        __afterLoad
                    );
                };

                if (document.addEventListener) {
                    document.addEventListener("finishedLoading", __afterLoad);
                } else {
                    document.attachEvent("finishedLoading", __afterLoad);
                }

                logo.blocks.loadNewBlocks(newBlock);
            } else {
                console.debug("Turtle " + turtleName + " already exists.");
                logo.stage.dispatchEvent(turtleName);
            }
        }
    }

    class TurtleNameBlock extends ValueBlock {
        constructor() {
            super("turtlename", _("mouse name"));
            this.setPalette("ensemble");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Mouse-name block returns the name of a mouse."),
                "documentation",
                null,
                "clickhelp"
            ]);

            this.formBlock({
                outType: "textout"
            });
        }

        arg(logo, turtle) {
            return logo.turtles.turtleList[turtle].name;
        }
    }

    class NumberOfTurtlesBlock extends ValueBlock {
        constructor() {
            super("turtlecount", _("mouse count"));
            this.setPalette("ensemble");
            this.hidden = (this.lang === "ja");

            this.setHelpString([
                _("The Mouse-count block returns the number of mice."),
                "documentation",
                null,
                "clickhelp"
            ]);

            this.formBlock({
                outType: "textout"
            });
        }

        arg(logo, turtle) {
            return logo.turtles.turtleList.length;
        }
    }

    class NthTurtleNameBlock extends LeftBlock {
        constructor() {
            super("nthturtle", _("nth mouse name"));
            this.setPalette("ensemble");
            this.hidden = (this.lang === "ja");

            this.setHelpString([
                _("The Nth-Mouse name block returns the name of the nth mice."),
                "documentation",
                null,
                "clickhelp"
            ]);

            this.formBlock({
                outType: "textout",
                args: 1,
                defaults: [1]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            if (typeof a === "number") {
                a -= 1;  // Internally, we count from 0
                if (a >= 0 && a < logo.turtles.turtleList.length) {
                    return logo.turtles.turtleList[a].name;
                } else {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        logo.errorMsg(_("Cannot find mouse"));
                    } else {
                        logo.errorMsg(_("Cannot find turtle"));
                    }
                    return "";
                }
            } else {
                logo.errorMsg(_("Index must be > 0."));
                return "";
            }
        }
    }

    class SetTurtleNameBlock extends FlowBlock {
        constructor() {
            super("setturtlename", _("set name"));
            this.setPalette("ensemble");
            this.setHelpString();

            this.formBlock({
                args: 2,
                defaults: [-1, _("Mr. Mouse")],
                argTypes: ["anyin", "anyin"],
                argLabels: [_("source"), _("target")]
            });
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            let foundTargetTurtle = false;
            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            } else if (args[0] === -1) {
                logo.turtles.turtleList[turtle].rename(args[1]);
                foundTargetTurtle = true;
            } else if (typeof args[0] === "number") {
                let i = Math.floor(args[0]);
                if (i >= 0 && i < logo.turtles.turtleList.length) {
                    logo.turtles.turtleList[i].rename(args[1]);
                    foundTargetTurtle = true;
                }
            } else {
                for (let i = 0; i < logo.turtles.turtleList.length; i++) {
                    if (logo.turtles.turtleList[i].name === args[0]) {
                        logo.turtles.turtleList[i].rename(args[1]);
                        foundTargetTurtle = true;
                        break;
                    }
                }
            }

            if (!foundTargetTurtle) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    logo.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    logo.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                logo.turtles.turtleList[turtle].rename(args[1]);
            }
        }
    }

    class SetTurtleName2Block extends FlowBlock {
        constructor() {
            super("setturtlename2", _("set name"));
            this.setPalette("ensemble");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set-name block is used to name a mouse."),
                "documentation",
                null,
                "clickhelp"
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("Mr. Mouse")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            logo.turtles.turtleList[turtle].rename(args[0]);
        }
    }

    new TurtleHeapBlock().setup();
    new StopTurtleBlock().setup();
    new StartTurtleBlock().setup();
    new TurtleColorBlock().setup();
    new TurtleHeadingBlock().setup();
    new SetXYTurtleBlock().setup();
    new SetTurtleBlock().setup();
    new YTurtleBlock().setup();
    new XTurtleBlock().setup();
    new TurtleElapsedNotesBlock().setup();
    new TurtlePitchBlock().setup();
    new TurtleNoteBlock().setup();
    new TurtleNote2Block().setup();
    new TurtleSyncBlock().setup();
    new NthTurtleNameBlock().setup();
    new NumberOfTurtlesBlock().setup();
    new FoundTurtleBlock().setup();
    new NewTurtleBlock().setup();
    new TurtleNameBlock().setup();
    new SetTurtleNameBlock().setup();
    new SetTurtleName2Block().setup();
}
