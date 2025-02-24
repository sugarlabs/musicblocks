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
    return activity.turtles.getTurtle(getTargetTurtle(activity.turtles, targetTurtle));
}

function setupEnsembleBlocks(activity) {
    // Extract common block setup logic
    function setupBlock(blockClass) {
        new blockClass().setup(activity);
    }

    // Extract common form block logic
    function createFormBlock(blockInstance, options) {
        blockInstance.formBlock(options);
    }

    // Extract common help string logic
    function setHelpString(blockInstance, helpText) {
        blockInstance.setHelpString(helpText);
    }

    // New function to initialize block with common properties
    function initializeBlock(blockInstance, paletteName, helpText) {
        blockInstance.setPalette(paletteName, activity);
        setHelpString(blockInstance, helpText);
    }

    // Refactor TurtleHeapBlock
    class TurtleHeapBlock extends LeftBlock {
        constructor() {
            super("turtleheap", _THIS_IS_MUSIC_BLOCKS_ ? t("mouse index heap") : t("turtle index heap"));
            initializeBlock(this, "ensemble", _THIS_IS_MUSIC_BLOCKS_
                ? [t("The Mouse index heap block returns a value in the heap at a specified location for a specified mouse."), "documentation", ""]
                : [t("The Turtle index heap block returns a value in the heap at a specified location for a specified turtle."), "documentation", ""]);

            const formOptions = {
                args: 2,
                defaults: [_THIS_IS_MUSIC_BLOCKS_ ? t("Mr. Mouse") : t("Yertle"), 1],
                argTypes: ["anyin", "numberin"],
                argLabels: [_THIS_IS_MUSIC_BLOCKS_ ? t("mouse name") : t("turtle name"), t("index")]
            };
            createFormBlock(this, formOptions);
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
                        activity.errorMsg(t("Index must be > 0."));
                    }

                    if (a > 1000) {
                        a = 1000;
                        activity.errorMsg(t("Maximum heap size is 1000."));
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
                super("stopTurtle", t("stop mouse"));
                this.setHelpString([
                    t("The Stop mouse block stops the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    defaults: [t("Mr. Mouse")],
                    argTypes: ["anyin"]
                });
            } else {
                super("stopTurtle", t("stop turtle"));
                this.setHelpString([
                    t("The Stop turtle block stops the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    defaults: [t("Yertle")],
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
                    activity.errorMsg(t("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + args[0], blk);
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
                super("startTurtle", t("start mouse"));
                this.setPalette("ensemble", activity);
                this.setHelpString([
                    t("The Start mouse block starts the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    defaults: [t("Mr. Mouse")],
                    argTypes: ["anyin"]
                });
            } else {
                super("startTurtle", t("start turtle"));
                this.setPalette("ensemble", activity);
                this.setHelpString([
                    t("The Start turtle block starts the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    defaults: [t("Yertle")],
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
                    activity.errorMsg(t("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                const tur = activity.turtles.ithTurtle(targetTurtle);

                if (tur.running) {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        activity.errorMsg(t("Mouse is already running."), blk);
                    } else {
                        activity.errorMsg(t("Turtle is already running."), blk);
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
                    activity.errorMsg(t("Cannot find start block") + " " + args[0], blk);
                }
            }
        }
    }

    class TurtleColorBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: pen color for this mouse
                super("turtlecolor", t("mouse color"));
                this.setHelpString([
                    t("The Mouse color block returns the pen color of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: pen color for this turtle
                super("turtlecolor", t("turtle color"));
                this.setHelpString([
                    t("The Turtle color block returns the pen color of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);

            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }

        arg(logo, turtle, blk, receivedArg) {
            const thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return thisTurtle.painter.color;
            return activity.turtles.getTurtle(turtle).painter.color;
        }
    }

    class TurtleHeadingBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: heading (compass direction) for this mouse
                super("turtleheading", t("mouse heading"));
                this.setHelpString([
                    t("The Mouse heading block returns the heading of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: heading (compass direction) for this turtle
                super("turtleheading", t("turtle heading"));
                this.setHelpString([
                    t("The Turtle heading block returns the heading of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);

            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }

        arg(logo, turtle, blk, receivedArg) {
            const thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return thisTurtle.orientation;
            return activity.turtles.getTurtle(turtle).orientation;
        }
    }

    class SetXYTurtleBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: set xy position for this mouse
                super("setxyturtle", t("set mouse"));
                this.setHelpString();

                this.formBlock({
                    args: 3,
                    defaults: [t("Mr. Mouse"), 0, 0],
                    argTypes: ["anyin", "numberin", "numberin"],
                    argLabels: [this.lang === "ja" ? t("name1") : t("name"), t("x"), t("y")]
                });
            } else {
                //.TRANS: set xy position for this turtle
                super("setxyturtle", t("set turtle"));
                this.setHelpString();

                this.formBlock({
                    args: 3,
                    defaults: [t("Yertle"), 0, 0],
                    argTypes: ["anyin", "numberin", "numberin"],
                    argLabels: [this.lang === "ja" ? t("name1") : t("name"), t("x"), t("y")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        flow(args, logo, turtle, blk) {
            const targetTurtle = getTargetTurtle(activity.turtles, args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(t("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + args[0], blk);
                }
            } else if (args.length === 3) {
                if (typeof args[1] === "string" || typeof args[2] === "string") {
                    activity.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    activity.turtles.getTurtle(targetTurtle).painter.doSetXY(args[1], args[2]);
                }
            }
        }
    }

    class SetTurtleBlock extends FlowClampBlock {
        constructor() {
            super("setturtle");
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    t("The Set mouse block sends a stack of blocks to be run by the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    name: t("set mouse"),
                    args: 1,
                    defaults: [t("Mr. Mouse")],
                    argTypes: ["anyin"]
                });
            } else {
                this.setHelpString([
                    t("The Set turtle block sends a stack of blocks to be run by the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    name: t("set turtle"),
                    args: 1,
                    defaults: [t("Yertle")],
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
                    activity.errorMsg(t("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + args[0], blk);
                }
            }
        }
    }

    class YTurtleBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: y position for this mouse
                super("yturtle", t("mouse y"));
                this.setHelpString([
                    t("The Y mouse block returns the Y position of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: y position for this turtle
                super("yturtle", t("turtle y"));
                this.setHelpString([
                    t("The Y turtle block returns the Y position of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return activity.turtles.screenY2turtleY(thisTurtle.container.y);
            thisTurtle = activity.turtles.getTurtle(turtle);
            // eslint-disable-next-line no-console
            console.debug("Mouse not found. Using current mouse value instead.");
            return activity.turtles.screenY2turtleY(thisTurtle.container.y);
        }
    }

    class XTurtleBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: x position for this mouse
                super("xturtle", t("mouse x"));
                this.setHelpString([
                    t("The X mouse block returns the X position of the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: x position for this turtle
                super("xturtle", t("turtle x"));
                this.setHelpString([
                    t("The X turtle block returns the X position of the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        arg(logo, turtle, blk, receivedArg) {
            let thisTurtle = _blockFindTurtle(activity, turtle, blk, receivedArg);

            if (thisTurtle) return activity.turtles.screenX2turtleX(thisTurtle.container.x);

            thisTurtle = activity.turtles.getTurtle(turtle);
            // eslint-disable-next-line no-console
            console.debug("Mouse not found. Using current mouse value instead.");
            return activity.turtles.screenX2turtleX(thisTurtle.container.x);
        }
    }

    class TurtleElapsedNotesBlock extends LeftBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: notes played by this mouse
                super("turtleelapsednotes", t("mouse notes played"));
                this.setHelpString([
                    t("The Mouse elapse notes block returns the number of notes played by the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: notes played by this turtle
                super("turtlelapsednotes", t("turtle notes played"));
                this.setHelpString([
                    t("The Turtle elapse notes block returns the number of notes played by the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
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
                super("turtlepitch", t("mouse pitch number"));
                this.setHelpString([
                    t("The Mouse pitch block returns the current pitch number being played by the specified mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: convert current note for this turtle to piano key (1-88)
                super("turtlepitch", t("turtle pitch number"));
                this.setHelpString([
                    t("The Turtle pitch block returns the current pitch number being played by the specified turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
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

            for (let i = 0; i < activity.turtles.getTurtleCount(); i++) {
                const thisTurtle = activity.turtles.getTurtle(i);
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
                    activity.errorMsg(t("Cannot find mouse") + " " + targetTurtle, blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + targetTurtle, blk);
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
                super(name || "turtlenote", displayName || t("mouse note value"));
                this.setHelpString();

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: note value is the duration of the note played by this turtle
                super(name || "turtlenote", displayName || t("turtle note value"));
                this.setHelpString();

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
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

            for (let i = 0; i < activity.turtles.getTurtleCount(); i++) {
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
                    activity.errorMsg(t("Cannot find mouse") + " " + targetTurtle, blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + targetTurtle, blk);
                }
                activity.blocks.blockList[blk].value = -1;
            }
        }
    }

    class TurtleNote2Block extends TurtleNoteBlock {
        constructor() {
            super("turtlenote2", t("mouse note value"));
            this.setHelpString();
            // Replaced by the dictionary get value block.
            this.hidden = this.deprecated = true;
        }
    }

    class TurtleSyncBlock extends FlowBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                //.TRANS: sync is short for synchronization
                super("turtlesync", t("mouse sync"));
                this.setHelpString([
                    t("The Mouse sync block aligns the beat count between mice."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                //.TRANS: sync is short for synchronization
                super("turtlesync", t("turtle sync"));
                this.setHelpString([
                    t("The Turtle sync block aligns the beat count between turtles."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
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
                    activity.errorMsg(t("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + args[0], blk);
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
                    t("The Found mouse block will return true if the specified mouse can be found."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    name: t("found mouse"),
                    flows: {
                        left: "bool"
                    },
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                this.setHelpString([
                    t("The Found turtle block will return true if the specified turtle can be found."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    name: t("found turtle"),
                    flows: {
                        left: "bool"
                    },
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
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
                super("newturtle", t("new mouse"));
                this.setHelpString([
                    t("The New mouse block will create a new mouse."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                super("newturtle", t("new turtle"));
                this.setHelpString([
                    t("The New turtle block will create a new turtle."),
                    "documentation",
                    ""
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
                });
            }

            this.setPalette("ensemble", activity);
        }

        flow(args, logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            const turtleName = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            if (getTargetTurtle(activity.turtles, turtleName) === null) {
                const blockNumber = activity.blocks.blockList.length;

                const x = activity.turtles.turtleX2screenX(activity.turtles.getTurtle(turtle).x);
                const y = activity.turtles.turtleY2screenY(activity.turtles.getTurtle(turtle).y);

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
                super("setturtlecolor", t("set mouse color"));

                this.setHelpString([
                    t("The Set-mouse-color block is used to set the color of a mouse."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("setturtlecolor", t("set turtle color"));

                this.setHelpString([
                    t("The Set-turtle-color block is used to set the color of a turtle."),
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

            // eslint-disable-next-line no-undef
            tur.doTurtleShell(55, "data:image/svg+xml;base64," + window.btoa(base64Encode(artwork)));

            // Restore the heading.
            if (heading != 0) {
                tur.painter.doSetHeading(heading);
            }
        }
    }


    class TurtleNameBlock extends ValueBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("turtlename", t("mouse name"));

                this.setHelpString([
                    t("The Mouse-name block returns the name of a mouse."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("turtlename", t("turtle name"));

                this.setHelpString([
                    t("The Turtle-name block returns the name of a turtle."),
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
            return activity.turtles.getTurtle(turtle).name;
        }
    }

    class NumberOfTurtlesBlock extends ValueBlock {
        constructor() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                super("turtlecount", t("mouse count"));

                this.setHelpString([
                    t("The Mouse-count block returns the number of mice."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("turtlecount", t("turtle count"));

                this.setHelpString([
                    t("The Turtle-count block returns the number of turtles."),
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
                super("nthturtle", t("nth mouse name"));

                this.setHelpString([
                    t("The Nth-Mouse name block returns the name of the nth mouse."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);
            } else {
                super("nthturtle", t("nth turtle name"));

                this.setHelpString([
                    t("The Nth-Turtle name block returns the name of the nth turtle."),
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
                if (a >= 0 && a < activity.turtles.getTurtleCount()) {
                    return activity.turtles.getTurtle(a).name;
                } else {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        activity.errorMsg(t("Cannot find mouse"));
                    } else {
                        activity.errorMsg(t("Cannot find turtle"));
                    }
                    return "";
                }
            } else {
                activity.errorMsg(t("Index must be > 0."));
                return "";
            }
        }
    }

    class SetTurtleNameBlock extends FlowBlock {
        constructor() {
            super("setturtlename", t("set name"));
            this.setPalette("ensemble", activity);
            this.setHelpString();

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.formBlock({
                    args: 2,
                    defaults: [-1, t("Mr. Mouse")],
                    argTypes: ["anyin", "anyin"],
                    argLabels: [t("source"), t("target")]
                });
            } else {
                this.formBlock({
                    args: 2,
                    defaults: [-1, t("Yertle")],
                    argTypes: ["anyin", "anyin"],
                    argLabels: [t("source"), t("target")]
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
                activity.turtles.getTurtle(turtle).rename(args[1]);
                foundTargetTurtle = true;
            } else if (typeof args[0] === "number") {
                const i = Math.floor(args[0]);
                if (i >= 0 && i < activity.turtles.getTurtleCount()) {
                    activity.turtles.getTurtle(i).rename(args[1]);
                    foundTargetTurtle = true;
                }
            } else {
                for (let i = 0; i < activity.turtles.getTurtleCount(); i++) {
                    if (activity.turtles.getTurtle(i).name === args[0]) {
                        activity.turtles.getTurtle(i).rename(args[1]);
                        foundTargetTurtle = true;
                        break;
                    }
                }
            }

            if (!foundTargetTurtle) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    activity.errorMsg(t("Cannot find mouse") + " " + args[0], blk);
                } else {
                    activity.errorMsg(t("Cannot find turtle") + " " + args[0], blk);
                }
            } else {
                activity.turtles.getTurtle(turtle).rename(args[1]);
            }
        }
    }

    class SetTurtleName2Block extends FlowBlock {
        constructor() {
            super("setturtlename2", t("set name"));
            this.setPalette("ensemble", activity);
            this.beginnerBlock(true);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.setHelpString([
                    t("The Set-name block is used to name a mouse."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Mr. Mouse")]
                });
            } else {
                this.setHelpString([
                    t("The Set-name block is used to name a turtle."),
                    "documentation",
                    null,
                    "clickhelp"
                ]);

                this.formBlock({
                    args: 1,
                    argTypes: ["anyin"],
                    defaults: [t("Yertle")]
                });
            }
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            activity.turtles.getTurtle(turtle).rename(args[0]);
        }
    }

    // initialize all blocks
    const blockClasses = [
        TurtleHeapBlock,
        StopTurtleBlock,
        StartTurtleBlock,
        TurtleColorBlock,
        TurtleHeadingBlock,
        SetXYTurtleBlock,
        SetTurtleBlock,
        YTurtleBlock,
        XTurtleBlock,
        TurtleElapsedNotesBlock,
        TurtlePitchBlock,
        TurtleNoteBlock,
        TurtleNote2Block,
        TurtleSyncBlock,
        NthTurtleNameBlock,
        NumberOfTurtlesBlock,
        FoundTurtleBlock,
        NewTurtleBlock,
        TurtleNameBlock,
        SetTurtleColorBlock,
        SetTurtleNameBlock,
        SetTurtleName2Block
    ];

    blockClasses.forEach(setupBlock);
}