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

   _, last, FlowBlock, ValueBlock, FlowClampBlock, LeftBlock, BooleanBlock,
   NOINPUTERRORMSG, NANERRORMSG, INVALIDPITCH, getNote, pitchToNumber,
   TURTLESVG, _THIS_IS_MUSIC_BLOCKS_, getMunsellColor
*/

/* exported setupEnsembleBlocks, getTargetTurtle */

/**
 * The target-turtle name can be a string or an int. Makes sure there is a turtle by this name and then finds the associated start block.
 * @param   turtles instance
 * @param   {number|string} targetTurtle
 * @returns {number|null}
 */
function getTargetTurtle(turtles, targetTurtle) {
    // We'll compare the names as strings so convert to "string" if "number".
    targetTurtle = targetTurtle.toString();

    for (const i in turtles.turtleList) {
        const turtle = turtles.ithTurtle(i);
        if (!turtle.inTrash) {
            // Convert to string incase of type "number".
            const turtleName = turtle.name.toString();
            if (turtleName === targetTurtle) return i;
        }
    }

    // eslint-disable-next-line no-console
    console.debug(`turtle "${targetTurtle}" not found`);
    return null;
}

function _blockFindTurtle(activity, turtle, blk, receivedArg) {
    const cblk = activity.blocks.blockList[blk].connections[1];
    if (cblk === null) {
        // eslint-disable-next-line no-console
        console.debug("Could not find connecting block");
        return null;
    }
    const targetTurtle = activity.logo.parseArg(activity.logo, turtle, cblk, blk, receivedArg);
    if (targetTurtle === null) {
        // eslint-disable-next-line no-console
        console.debug("Could not find target turtle name from arg");
        return null;
    }
    return activity.turtles.turtleList[getTargetTurtle(activity.turtles, targetTurtle)];
}

function setupEnsembleBlocks(activity) {
    class TurtleHeapBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("turtleheap", _("mouse index heap"));
                this.setHelpString([
                    _("The Mouse index heap block returns a value in the heap at a specified location for a specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 2,
                    defaults: [_("Mr. Mouse"), 1],
                    argTypes: ["anyin", "numberin"],
                    argLabels: [_("mouse name"), _("index")]
                });
            } else {
                super("turtleheap", _("turtle index heap"));
                this.setHelpString([
                    _("The Turtle index heap block returns a value in the heap at a specified location for a specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 2,
                    //.TRANS: Yertle is the name of a turtle.
                    defaults: [_("Yertle"), 1],
                    argTypes: ["anyin", "numberin"],
                    argLabels: [_("turtle name"), _("index")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return -1;
            }

            const targetTurtle = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const i = getTargetTurtle(activity.turtles, targetTurtle);
            if (i < 0) return -1;

            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk2 === null) {
                activity.errorMsg(NANERRORMSG, blk);
            } else {
                let a = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                if (typeof a === "number") {
                    if (!(i in logo.turtleHeaps)) {
                        logo.turtleHeaps[i] = [];
                    }

                    if (a < 1) {
                        a = 1;
                        activity.errorMsg(_("Index must be > 0."));
                    }

                    if (a > 1000) {
                        a = 1000;
                        activity.errorMsg(_("Maximum heap size is 1000."));
                    }

                    // If index > heap length, grow the heap.
                    while (logo.turtleHeaps[i].length < a) {
                        logo.turtleHeaps[i].push(0);
                    }
                    return logo.turtleHeaps[i][a - 1];
                } else {
                    activity.errorMsg(NANERRORMSG, blk);
                }
            }
        }
    }

    class StopTurtleBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("stopTurtle", _("stop mouse"));
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
            } else {
                super("stopTurtle", _("stop turtle"));
                this.setHelpString([
                    _("The Stop turtle block stops the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    defaults: [_("Yertle")],
                    argTypes: ["anyin"]
                });
            }

            this.setPalette("ensemble", activity);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const targetTurtle = getTargetTurtle(activity.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                const tur = activity.turtles.ithTurtle(targetTurtle);

                tur.queue = [];
                tur.parentFlowQueue = [];
                tur.unhighlightQueue = [];
                tur.parameterQueue = [];
                // eslint-disable-next-line no-console
                console.debug("stopping " + targetTurtle);
                activity.turtles.ithTurtle(turtle).running = false;
                logo.doBreak(tur);
            }
        }
    }

    class StartTurtleBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("startTurtle", _("start mouse"));
                this.setPalette("ensemble", activity);
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
            } else {
                super("startTurtle", _("start turtle"));
                this.setPalette("ensemble", activity);
                this.setHelpString([
                    _("The Start turtle block starts the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    defaults: [_("Yertle")],
                    argTypes: ["anyin"]
                });
            }
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            // eslint-disable-next-line no-console
            console.debug("start mouse from mouse " + turtle);
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const targetTurtle = getTargetTurtle(activity.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                const tur = activity.turtles.ithTurtle(targetTurtle);

                if (tur.running) {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        activity.errorMsg(_("Mouse is already running."), blk);
                    } else {
                        activity.errorMsg(_("Turtle is already running."), blk);
                    }
                    return;
                }
                tur.queue = [];
                tur.running = true;
                tur.parentFlowQueue = [];
                tur.unhighlightQueue = [];
                tur.parameterQueue = [];
                // Find the start block associated with this turtle.
                let foundStartBlock = false;
                let startBlk = null;
                for (let i = 0; i < activity.blocks.blockList.length; i++) {
                    if (activity.blocks.blockList[i] === tur.startBlock) {
                        foundStartBlock = true;
                        startBlk = i;
                        break;
                    }
                }
                if (foundStartBlock) {
                    // eslint-disable-next-line no-console
                    console.debug("STARTING " + targetTurtle + " " + startBlk);
                    logo.runFromBlock(logo, targetTurtle, startBlk, isflow, receivedArg);
                } else {
                    activity.errorMsg(_("Cannot find start block") + " " + args[0], blk);
                }
            }
        }
    }

    class TurtleColorBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: pen color for this mouse
                super("turtlecolor", _("mouse color"));
                this.setHelpString([
                    _("The Mouse color block returns the pen color of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Mr. Mouse")]
                });
            } else {
                //.TRANS: pen color for this turtle
                super("turtlecolor", _("turtle color"));
                this.setHelpString([
                    _("The Turtle color block returns the pen color of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);

            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }

        arg(logo, turtle, blk, receivedArg) {
            const thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return thisTurtle.painter.color;
            return activity.turtles.turtleList[turtle].painter.color;
        }
    }

    class TurtleHeadingBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: heading (compass direction) for this mouse
                super("turtleheading", _("mouse heading"));
                this.setHelpString([
                    _("The Mouse heading block returns the heading of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Mr. Mouse")]
                });
            } else {
                //.TRANS: heading (compass direction) for this turtle
                super("turtleheading", _("turtle heading"));
                this.setHelpString([
                    _("The Turtle heading block returns the heading of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);

            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }

        arg(logo, turtle, blk, receivedArg) {
            const thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return thisTurtle.orientation;
            return activity.turtles.turtleList[turtle].orientation;
        }
    }

    class SetXYTurtleBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: set xy position for this mouse
                super("setxyturtle", _("set mouse"));
                this.setHelpString();

                this.formBlock({
                    args: 3,
                    defaults: [_("Mr. Mouse"), 0, 0],
                    argTypes: ["anyin", "numberin", "numberin"],
                    argLabels: [this.lang === "ja" ? _("name1") : _("name"), _("x"), _("y")]
                });
            } else {
                //.TRANS: set xy position for this turtle
                super("setxyturtle", _("set turtle"));
                this.setHelpString();

                this.formBlock({
                    args: 3,
                    defaults: [_("Yertle"), 0, 0],
                    argTypes: ["anyin", "numberin", "numberin"],
                    argLabels: [this.lang === "ja" ? _("name1") : _("name"), _("x"), _("y")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        flow(args, logo, turtle, blk) {
            const targetTurtle = getTargetTurtle(activity.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else if (args.length === 3) {
                if (typeof args[1] === "string" || typeof args[2] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    activity.turtles.turtleList[targetTurtle].painter.doSetXY(args[1], args[2]);
                }
            }
        }
    }

    class SetTurtleBlock extends FlowClampBlock {
        constructor() {
            super("setturtle");
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Set mouse block sends a stack of blocks to be run by the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    name: _("set mouse"),
                    args: 1,
                    defaults: [_("Mr. Mouse")],
                    argTypes: ["anyin"]
                });
            } else {
                this.setHelpString([
                    _("The Set turtle block sends a stack of blocks to be run by the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    name: _("set turtle"),
                    args: 1,
                    defaults: [_("Yertle")],
                    argTypes: ["anyin"]
                });
            }

            this.setPalette("ensemble", activity);
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            const targetTurtle = getTargetTurtle(activity.turtles, args[0]);
            if (targetTurtle !== null) {
                logo.runFromBlock(logo, targetTurtle, args[1], isflow, receivedArg);
            } else {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            }
        }
    }

    class YTurtleBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: y position for this mouse
                super("yturtle", _("mouse y"));
                this.setHelpString([
                    _("The Y mouse block returns the Y position of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Mr. Mouse")]
                });
            } else {
                //.TRANS: y position for this turtle
                super("yturtle", _("turtle y"));
                this.setHelpString([
                    _("The Y turtle block returns the Y position of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return activity.turtles.screenY2turtleY(thisTurtle.container.y);
            thisTurtle = activity.turtles.turtleList[turtle];
            // eslint-disable-next-line no-console
            console.debug("Mouse not found. Using current mouse value instead.");
            return activity.turtles.screenY2turtleY(thisTurtle.container.y);
        }
    }

    class XTurtleBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: x position for this mouse
                super("xturtle", _("mouse x"));
                this.setHelpString([
                    _("The X mouse block returns the X position of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Mr. Mouse")]
                });
            } else {
                //.TRANS: x position for this turtle
                super("xturtle", _("turtle x"));
                this.setHelpString([
                    _("The X turtle block returns the X position of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return activity.turtles.screenX2turtleX(thisTurtle.container.x);

            thisTurtle = activity.turtles.turtleList[turtle];
            // eslint-disable-next-line no-console
            console.debug("Mouse not found. Using current mouse value instead.");
            return activity.turtles.screenX2turtleX(thisTurtle.container.x);
        }
    }

    class TurtleElapsedNotesBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: notes played by this mouse
                super("turtlelapsednotes", _("mouse notes played"));
                this.setHelpString([
                    _("The Mouse elapse notes block returns the number of notes played by the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Mr. Mouse")]
                });
            } else {
                //.TRANS: notes played by this turtle
                super("turtlelapsednotes", _("turtle notes played"));
                this.setHelpString([
                    _("The Turtle elapse notes block returns the number of notes played by the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);

            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }

        /**
         * @todo FIXME
         */
        arg(logo, turtle, blk, receivedArg) {
            const thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) {
                const tur = activity.turtles.ithTurtle(thisTurtle);
                return tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1];
            }

            const tur = activity.turtles.ithTurtle(turtle);
            return tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1];
        }
    }

    class TurtlePitchBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: convert current note for this turtle to piano key (1-88)
                super("turtlepitch", _("mouse pitch number"));
                this.setHelpString([
                    _("The Mouse pitch block returns the current pitch number being played by the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Mr. Mouse")]
                });
            } else {
                //.TRANS: convert current note for this turtle to piano key (1-88)
                super("turtlepitch", _("turtle pitch number"));
                this.setHelpString([
                    _("The Turrle pitch block returns the current pitch number being played by the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);

            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }

        arg(logo, turtle, blk, receivedArg) {
            let value = null;
            const cblk = activity.blocks.blockList[blk].connections[1];
            const targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            const tur = activity.turtles.ithTurtle(turtle);

            for (let i = 0; i < activity.turtles.turtleList.length; i++) {
                const thisTurtle = activity.turtles.turtleList[i];
                if (targetTurtle === thisTurtle.name) {
                    let obj;
                    if (thisTurtle.singer.lastNotePlayed !== null) {
                        const len = thisTurtle.singer.lastNotePlayed[0].length;
                        const pitch = thisTurtle.singer.lastNotePlayed[0].slice(0, len - 1);
                        const octave = parseInt(thisTurtle.singer.lastNotePlayed[0].slice(len - 1));

                        obj = [pitch, octave];
                    } else if (thisTurtle.singer.notePitches.length > 0) {
                        obj = getNote(
                            thisTurtle.singer.notePitches[0],
                            thisTurtle.singer.noteOctaves[0],
                            0,
                            thisTurtle.singer.keySignature,
                            tur.singer.movable,
                            null,
                            activity.errorMsg,
                            logo.synth.inTemperament
                        );
                    } else {
                        // eslint-disable-next-line no-console
                        console.debug("Cannot find a note for mouse " + turtle);
                        activity.errorMsg(INVALIDPITCH, blk);
                        obj = ["G", 4];
                    }

                    value =
                        pitchToNumber(obj[0], obj[1], thisTurtle.singer.keySignature) -
                        tur.singer.pitchNumberOffset;
                    activity.blocks.blockList[blk].value = value;
                    break;
                }
            }

            if (value === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + targetTurtle, blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + targetTurtle, blk);
                }

                let obj;
                if (tur.singer.lastNotePlayed !== null) {
                    const len = tur.singer.lastNotePlayed[0].length;
                    const pitch = tur.singer.lastNotePlayed[0].slice(0, len - 1);
                    const octave = parseInt(tur.singer.lastNotePlayed[0].slice(len - 1));
                    obj = [pitch, octave];
                } else if (tur.singer.notePitches.length > 0) {
                    obj = getNote(
                        tur.singer.notePitches[last(tur.singer.inNoteBlock)][0],
                        tur.singer.noteOctaves[last(tur.singer.inNoteBlock)][0],
                        0,
                        tur.singer.keySignature,
                        tur.singer.movable,
                        null,
                        activity.errorMsg,
                        logo.synth.inTemperament
                    );
                } else {
                    // eslint-disable-next-line no-console
                    console.debug("Cannot find a note for mouse " + turtle);
                    activity.errorMsg(INVALIDPITCH, blk);
                    obj = ["G", 4];
                }

                value =
                    pitchToNumber(obj[0], obj[1], tur.singer.keySignature) -
                    tur.singer.pitchNumberOffset;
                activity.blocks.blockList[blk].value = value;
            }
        }
    }

    class TurtleNoteBlock extends LeftBlock {
        constructor(name, displayName) {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: note value is the duration of the note played by this mouse
                super(name || "turtlenote", displayName || _("mouse note value"));
                this.setHelpString();

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Mr. Mouse")]
                });
            } else {
                //.TRANS: note value is the duration of the note played by this turtle
                super(name || "turtlenote", displayName || _("turtle note value"));
                this.setHelpString();

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);

            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }

        arg(logo, turtle, blk, receivedArg) {
            let value = null;
            const cblk = activity.blocks.blockList[blk].connections[1];
            const targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            for (let i = 0; i < activity.turtles.turtleList.length; i++) {
                const thisTurtle = activity.turtles.ithTurtle(i);
                if (targetTurtle === thisTurtle.name) {
                    if (
                        thisTurtle.singer.inNoteBlock.length > 0 &&
                        last(thisTurtle.singer.inNoteBlock) in thisTurtle.singer.noteValue
                    ) {
                        value =
                            1 / thisTurtle.singer.noteValue[last(thisTurtle.singer.inNoteBlock)];
                    } else if (thisTurtle.singer.lastNotePlayed !== null) {
                        value = thisTurtle.singer.lastNotePlayed[1];
                    } else if (thisTurtle.singer.notePitches.length > 0) {
                        value = thisTurtle.singer.noteBeat[last(thisTurtle.singer.inNoteBlock)];
                    } else {
                        value = -1;
                    }

                    if (activity.blocks.blockList[blk].name === "turtlenote") {
                        activity.blocks.blockList[blk].value = value;
                    } else if (value !== 0) {
                        activity.blocks.blockList[blk].value = 1 / value;
                    } else {
                        activity.blocks.blockList[blk].value = 0;
                    }
                    break;
                }
            }

            if (value === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + targetTurtle, blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + targetTurtle, blk);
                }
                activity.blocks.blockList[blk].value = -1;
            }
        }
    }

    class TurtleNote2Block extends TurtleNoteBlock {
        constructor() {
            super("turtlenote2", _("mouse note value"));
            this.setHelpString();
            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }
    }

    class TurtleSyncBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: sync is short for synchronization
                super("turtlesync", _("mouse sync"));
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
            } else {
                //.TRANS: sync is short for synchronization
                super("turtlesync", _("turtle sync"));
                this.setHelpString([
                    _("The Turtle sync block aligns the beat count between turtles."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const targetTurtle = getTargetTurtle(activity.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                activity.turtles.ithTurtle(turtle).singer.turtleTime = activity.turtles.ithTurtle(
                    targetTurtle
                ).singer.turtleTime;
            }
        }
    }

    class FoundTurtleBlock extends BooleanBlock {
        constructor() {
            super("foundturtle");
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    _("The Found mouse block will return true if the specified mouse can be found."),
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
            } else {
                this.setHelpString([
                    _("The Found turtle block will return true if the specified turtle can be found."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    name: _("found turtle"),
                    flows: {
                        left: "bool"
                    },
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            const targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            return getTargetTurtle(activity.turtles, targetTurtle) !== null;
        }
    }

    class NewTurtleBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("newturtle", _("new mouse"));
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
            } else {
                super("newturtle", _("new turtle"));
                this.setHelpString([
                    _("The New turtle block will create a new turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        flow(args, logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            const turtleName = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            if (getTargetTurtle(activity.turtles, turtleName) === null) {
                const blockNumber = activity.blocks.blockList.length;

                const x = activity.turtles.turtleX2screenX(activity.turtles.turtleList[turtle].x);
                const y = activity.turtles.turtleY2screenY(activity.turtles.turtleList[turtle].y);

                const newBlock = [
                    [0, "start", x, y, [null, 1, null]],
                    [1, "setturtlename2", 0, 0, [0, 2, null]],
                    [2, ["text", { value: turtleName }], 0, 0, [1]]
                ];
                const __afterLoad = () => {
                    const thisTurtle = activity.blocks.blockList[blockNumber].value;
                    const tur = activity.turtles.ithTurtle(thisTurtle);

                    logo.initTurtle(thisTurtle);
                    tur.queue = [];
                    tur.parentFlowQueue = [];
                    tur.unhighlightQueue = [];
                    tur.parameterQueue = [];
                    tur.running = true;
                    logo.runFromBlock(logo, thisTurtle, blockNumber, 0, receivedArg);
                    // Dispatch an event to indicate logo this turtle is running
                    activity.stage.dispatchEvent(turtleName);
                    document.removeEventListener("finishedLoading", __afterLoad);
                };

                if (document.addEventListener) {
                    document.addEventListener("finishedLoading", __afterLoad);
                } else {
                    document.attachEvent("finishedLoading", __afterLoad);
                }

                activity.blocks.loadNewBlocks(newBlock);
            } else {
                // eslint-disable-next-line no-console
                console.debug("Turtle " + turtleName + " already exists.");
                activity.stage.dispatchEvent(turtleName);
            }
        }
    }

    class SetTurtleColorBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("setturtlecolor", _("set mouse color"));

                this.setHelpString([
                    _("The Set-mouse-color block is used to set the color of a mouse."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("setturtlecolor", _("set turtle color"));

                this.setHelpString([
                    _("The Set-turtle-color block is used to set the color of a turtle."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            }

            this.setPalette("ensemble", activity);
            this.beginnerBlock(true);
            this.piemenuValuesC1 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [0]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            const heading = tur.orientation;
            // Heading needs to be set to 0 when we update the graphic.
            if (heading != 0) {
                tur.painter.doSetHeading(0);
            }

            let fillColor;
            let strokeColor;
            if (typeof args[0] === "number") {
                fillColor = getMunsellColor(args[0], 50, 100);
                strokeColor = getMunsellColor(args[0], 70, 80);
            } else {
                fillColor = getMunsellColor(0, 50, 100);
                strokeColor = getMunsellColor(0, 70, 80);
            }
            const artwork = TURTLESVG
                .replace(/fill_color/g, fillColor)
                .replace(/stroke_color/g, strokeColor);

            tur.doTurtleShell(55, "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(artwork))));

            // Restore the heading.
            if (heading != 0) {
                tur.painter.doSetHeading(heading);
            }
        }
    }


    class TurtleNameBlock extends ValueBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("turtlename", _("mouse name"));

                this.setHelpString([
                    _("The Mouse-name block returns the name of a mouse."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("turtlename", _("turtle name"));

                this.setHelpString([
                    _("The Turtle-name block returns the name of a turtle."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            }

            this.setPalette("ensemble", activity);
            this.beginnerBlock(true);

            this.formBlock({
                outType: "textout"
            });
        }

        arg(logo, turtle) {
            return activity.turtles.turtleList[turtle].name;
        }
    }

    class NumberOfTurtlesBlock extends ValueBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("turtlecount", _("mouse count"));

                this.setHelpString([
                    _("The Mouse-count block returns the number of mice."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("turtlecount", _("turtle count"));

                this.setHelpString([
                    _("The Turtle-count block returns the number of turtles."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            }

            this.setPalette("ensemble", activity);

            this.formBlock({
                outType: "numberout"
            });
        }

        arg() {
            return activity.turtles.turtleCount();
        }
    }

    class NthTurtleNameBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("nthturtle", _("nth mouse name"));

                this.setHelpString([
                    _("The Nth-Mouse name block returns the name of the nth mouse."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("nthturtle", _("nth turtle name"));

                this.setHelpString([
                    _("The Nth-Turtle name block returns the name of the nth turtle."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            }

            this.setPalette("ensemble", activity);

            this.formBlock({
                outType: "textout",
                args: 1,
                defaults: [1]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            if (typeof a === "number") {
                a -= 1; // Internally, we count from 0
                if (a >= 0 && a < activity.turtles.turtleList.length) {
                    return activity.turtles.turtleList[a].name;
                } else {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        activity.errorMsg(_("Cannot find mouse"));
                    } else {
                        activity.errorMsg(_("Cannot find turtle"));
                    }
                    return "";
                }
            } else {
                activity.errorMsg(_("Index must be > 0."));
                return "";
            }
        }
    }

    class SetTurtleNameBlock extends FlowBlock {
        constructor() {
            super("setturtlename", _("set name"));
            this.setPalette("ensemble", activity);
            this.setHelpString();

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.formBlock({
                    args: 2,
                    defaults: [-1, _("Mr. Mouse")],
                    argTypes: ["anyin", "anyin"],
                    argLabels: [_("source"), _("target")]
                });
            } else {
                this.formBlock({
                    args: 2,
                    defaults: [-1, _("Yertle")],
                    argTypes: ["anyin", "anyin"],
                    argLabels: [_("source"), _("target")]
                });
            }
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            let foundTargetTurtle = false;
            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            } else if (args[0] === -1) {
                activity.turtles.turtleList[turtle].rename(args[1]);
                foundTargetTurtle = true;
            } else if (typeof args[0] === "number") {
                const i = Math.floor(args[0]);
                if (i >= 0 && i < activity.turtles.turtleList.length) {
                    activity.turtles.turtleList[i].rename(args[1]);
                    foundTargetTurtle = true;
                }
            } else {
                for (let i = 0; i < activity.turtles.turtleList.length; i++) {
                    if (activity.turtles.turtleList[i].name === args[0]) {
                        activity.turtles.turtleList[i].rename(args[1]);
                        foundTargetTurtle = true;
                        break;
                    }
                }
            }

            if (!foundTargetTurtle) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(_("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(_("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                activity.turtles.turtleList[turtle].rename(args[1]);
            }
        }
    }

    class SetTurtleName2Block extends FlowBlock {
        constructor() {
            super("setturtlename2", _("set name"));
            this.setPalette("ensemble", activity);
            this.beginnerBlock(true);

            if (_THIS_IS_MUSIC_BLOCKS_) {
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
            } else {
                this.setHelpString([
                    _("The Set-name block is used to name a turtle."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [_("Yertle")]
                });
            }
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            activity.turtles.turtleList[turtle].rename(args[0]);
        }
    }

    new TurtleHeapBlock().setup(activity);
    new StopTurtleBlock().setup(activity);
    new StartTurtleBlock().setup(activity);
    new TurtleColorBlock().setup(activity);
    new TurtleHeadingBlock().setup(activity);
    new SetXYTurtleBlock().setup(activity);
    new SetTurtleBlock().setup(activity);
    new YTurtleBlock().setup(activity);
    new XTurtleBlock().setup(activity);
    new TurtleElapsedNotesBlock().setup(activity);
    new TurtlePitchBlock().setup(activity);
    new TurtleNoteBlock().setup(activity);
    new TurtleNote2Block().setup(activity);
    new TurtleSyncBlock().setup(activity);
    new NthTurtleNameBlock().setup(activity);
    new NumberOfTurtlesBlock().setup(activity);
    new FoundTurtleBlock().setup(activity);
    new NewTurtleBlock().setup(activity);
    new TurtleNameBlock().setup(activity);
    new SetTurtleColorBlock().setup(activity);
    new SetTurtleNameBlock().setup(activity);
    new SetTurtleName2Block().setup(activity);
}
