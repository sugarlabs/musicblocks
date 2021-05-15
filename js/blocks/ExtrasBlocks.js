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

   _, last, FlowBlock, ValueBlock, LeftBlock, NOINPUTERRORMSG,
   NANERRORMSG, mixedNumber, TONEBPM, DEFAULTDELAY, Singer,
   StackClampBlock, platformColor
*/

/* exported setupExtrasBlocks */

function setupExtrasBlocks(activity) {
    class FloatToStringBlock extends LeftBlock {
        constructor() {
            super("float2string", _("fraction"));
            this.setPalette("extras", activity);
            this.setHelpString([
                _("Convert a float to a fraction") + " 0.5 -> 1/2",
                "documentation",
                null,
                "float2string"
            ]);
            this.parameter = true;

            this.formBlock({
                args: 1,
                argTypes: ["anyin"]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return "0/1";
            } else {
                let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (typeof a === "number") {
                    if (a < 0) {
                        a = a * -1;
                        return "-" + mixedNumber(a);
                    }
                    return mixedNumber(a);
                }
                activity.errorMsg(NANERRORMSG, blk);
                return "0/1";
            }
        }
    }

    class SaveABCBlock extends FlowBlock {
        constructor() {
            super("saveabc");
            this.setPalette("extras", activity);
            this.setHelpString();

            this.formBlock({
                name: _("save as ABC"),
                args: 1,
                argTypes: ["textin"],
                defaults: [_("title") + ".abc"]
            });
            this.hidden = true;
            this.deprecated = true;
        }

        flow(args) {
            if (args.length === 1) {
                activity.save.afterSaveAbc(args[0]);
            }
        }
    }

    class SaveLilypondBlock extends FlowBlock {
        constructor() {
            super("savelilypond");
            this.setPalette("extras", activity);
            this.setHelpString();

            this.formBlock({
                name: _("save as Lilypond"),
                args: 1,
                argTypes: ["textin"],
                defaults: [_("title") + ".ly"]
            });
            this.hidden = true;
            this.deprecated = true;
        }

        flow(args) {
            if (args.length === 1) {
                activity.save.afterSaveLilypond(args[0]);
            }
        }
    }

    class SaveSVGBlock extends FlowBlock {
        constructor() {
            super("savesvg");
            this.setPalette("extras", activity);
            this.setHelpString();

            this.formBlock({
                name: _("save as SVG"),
                args: 1,
                argTypes: ["textin"],
                defaults: [_("title") + ".svg"]
            });
            this.hidden = true;
            this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args.length === 1) {
                if (logo.svgBackground) {
                    logo.svgOutput =
                        '<rect x="0" y="0" height="' +
                        logo.canvas.height +
                        '" width="' +
                        logo.canvas.width +
                        '" fill="' +
                        platformColor.background +
                        '"/> ' +
                        logo.svgOutput;
                }

                activity.save.saveSVG(args[0]);
            }
        }
    }

    class NoBackgroundBlock extends FlowBlock {
        constructor() {
            super("nobackground", _("no background"));
            this.setPalette("extras", activity);
            this.setHelpString([
                _("The No background block eliminates the background from the saved SVG output."),
                "documentation",
                "",
                "makehelp"
            ]);
        }

        flow(args, logo) {
            logo.svgBackground = false;
        }
    }

    class ShowBlocksBlock extends FlowBlock {
        constructor() {
            super("showblocks", _("show blocks"));
            this.setPalette("extras", activity);
            this.setHelpString([_("The Show blocks block shows the blocks."), "documentation", ""]);
        }

        flow(args, logo) {
            activity.blocks.showBlocks();
            logo.turtleDelay = DEFAULTDELAY;
        }
    }

    class HideBlocksBlock extends FlowBlock {
        constructor() {
            super("hideblocks", _("hide blocks"));
            this.setPalette("extras", activity);
            this.setHelpString([_("The Hide blocks block hides the blocks."), "documentation", ""]);
        }

        flow(args, logo) {
            activity.blocks.hideBlocks();
            logo.showBlocksAfterRun = false;
            logo.turtleDelay = 0;
        }
    }

    class VSpaceBlock extends FlowBlock {
        constructor() {
            super("vspace", "↓");
            this.setPalette("extras", activity);
            this.setHelpString([
                _("The Space block is used to add space between blocks."),
                "documentation",
                ""
            ]);

            this.extraWidth = -10;
        }

        flow() {
            //
        }
    }

    class HSpaceBlock extends LeftBlock {
        constructor() {
            super("hspace", "←");
            this.setPalette("extras", activity);
            this.setHelpString([
                _("The Space block is used to add space between blocks."),
                "documentation",
                ""
            ]);

            this.extraWidth = -10;
            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                outType: "anyout"
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            return logo.parseArg(logo, turtle, cblk, blk, receivedArg);
        }
    }

    class WaitBlock extends FlowBlock {
        constructor() {
            super("wait", _("wait"));
            this.setPalette("extras", activity);
            this.setHelpString([
                _("The Wait block pauses the program for a specified number of seconds."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [1]
            });
        }

        flow(args, logo, turtle) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (args.length === 1) {
                const bpmFactor =
                    TONEBPM / tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM;

                const noteBeatValue = bpmFactor / (1 / args[0]);
                tur.singer.previousTurtleTime = tur.singer.turtleTime;
                tur.singer.turtleTime += noteBeatValue;
                tur.doWait(args[0]);
            }
        }
    }

    class CommentBlock extends FlowBlock {
        constructor() {
            super("comment");
            this.setPalette("extras", activity);
            this.setHelpString([
                _(
                    "The Comment block prints a comment at the top of the screen when the program is running in slow mode."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("comment"),
                args: 1,
                defaults: ["Music Blocks"],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle) {
            if (args[0] !== null) {
                if (
                    !activity.turtles.ithTurtle(turtle).singer.suppressOutput &&
                    logo.turtleDelay > 0
                ) {
                    activity.textMsg(args[0].toString());
                }
            }
        }
    }

    class PrintBlock extends FlowBlock {
        constructor() {
            super("print", _("print"));
            if (activity.beginnerMode) this.setPalette("media", activity);
            else this.setPalette("extras", activity);

            this.beginnerBlock(true);

            this.setHelpString([
                _("The Print block displays text at the top of the screen."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: ["Music Blocks"],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (logo.inOscilloscope && cblk !== null) {
                const name = activity.blocks.blockList[cblk].value;
                let turtle = -1;
                for (let i = 0; i < activity.turtles.turtleList.length; i++) {
                    if (!activity.turtles.turtleList[i].inTrash) {
                        const turtleName = activity.turtles.turtleList[i].name;
                        if (turtleName === name) turtle = i;
                    }
                }
                if (
                    turtle > -1 &&
                    logo.oscilloscopeTurtles.indexOf(activity.turtles.turtleList[turtle]) < 0
                )
                    logo.oscilloscopeTurtles.push(activity.turtles.turtleList[turtle]);
            } else if (!logo.inStatusMatrix) {
                if (args.length === 1) {
                    if (args[0] !== null) {
                        const tur = activity.turtles.ithTurtle(turtle);

                        if (!tur.singer.suppressOutput) {
                            if (activity.blocks.blockList[cblk].name === "grid") {
                                // eslint-disable-next-line no-use-before-define
                                const temp = new DisplayGridBlock();
                                temp.flow(args, logo, turtle, blk);
                            } else {
                                const tur = activity.turtles.ithTurtle(turtle);
                                if (tur.singer.inNoteBlock.length > 0) {
                                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                                } else {
                                    activity.textMsg(args[0].toString());
                                }
                            }
                        } else if (logo.runningLilypond) {
                            if (tur.singer.inNoteBlock.length > 0) {
                                logo.notation.notationMarkup(turtle, args[0].toString());
                            }
                        }
                    }
                }
            }
        }
    }

    class DrumBlock extends StackClampBlock {
        constructor() {
            super("drum");
            this.setPalette("extras", activity);
            this.setHelpString();

            this.formBlock({ name: _("start drum"), canCollapse: true });
            this.hidden = this.deprecated = true;
        }

        flow(args) {
            if (args.length === 1) return [args[0], 1];
        }
    }

    //DEPRECATED grid: now used with print block.
    class DisplayGridBlock extends FlowBlock {
        constructor() {
            super("displaygrid", _("display grid"));
            this.setPalette("extras", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Display Grid Block changes the grid type"),
                "documentation",
                null
            ]);

            this.formBlock({
                args: 1,
                defaults: ["Cartesian"],
                argTypes: ["gridin"]
            });
            this.makeMacro((x, y) => [
                [0, "displaygrid", x, y, [null, 1, null]],
                [1, ["grid", { value: "Cartesian" }], 0, 0, [0]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args) {
            if (!args || !args[0]) {
                args = ["Cartesian"];
            }
            const act = activity.blocks.activity;
            activity.hideGrids();
            switch (args[0]) {
                case _("Cartesian"):
                    act._showCartesian();
                    break;
                case _("polar"):
                    act._showPolar();
                    break;
                case _("Cartesian+polar"):
                    act._showPolar();
                    act._showCartesian();
                    break;
                case _("treble"):
                    act._showTreble();
                    break;
                case _("grand staff"):
                    act._showGrand();
                    break;
                case _("mezzo-soprano"):
                    act._showSoprano();
                    break;
                case _("alto"):
                    act._showAlto();
                    break;
                case _("tenor"):
                    act._showTenor();
                    break;
                case _("bass"):
                    act._showBass();
                    break;
                case _("none"):
                    break;
            }
        }
    }

    class GridBlock extends ValueBlock {
        constructor() {
            super("grid");
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({ outType: "gridout" });
        }
    }

    // NOP blocks (used as placeholders when loaded blocks not found)
    class NOPValueBlock extends ValueBlock {
        constructor() {
            super("nopValueBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({ outType: "anyout" });
            this.hidden = true;
        }
    }

    class NOPOneArgMathBlock extends LeftBlock {
        constructor() {
            super("nopOneArgMathBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                outType: "anyout"
            });
            this.hidden = true;
        }
    }

    class NOPTwoArgMathBlock extends LeftBlock {
        constructor() {
            super("nopOneArgMathBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({
                args: 2,
                argTypes: ["anyin", "anyin"],
                outType: "anyout"
            });
            this.hidden = true;
        }
    }

    class NOPZeroArgBlock extends FlowBlock {
        constructor() {
            super("nopZeroArgBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.hidden = true;
        }
    }

    class NOPOneArgBlock extends FlowBlock {
        constructor() {
            super("nopOneArgBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({ args: 1, argTypes: ["anyin"] });
            this.hidden = true;
        }
    }

    class NOPTwoArgBlock extends FlowBlock {
        constructor() {
            super("nopTwoArgBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({ args: 2, argTypes: ["anyin", "anyin"] });
            this.hidden = true;
        }
    }

    class NOPThreeArgBlock extends FlowBlock {
        constructor() {
            super("nopThreeArgBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({ args: 3, argTypes: ["anyin", "anyin", "anyin"] });
            this.hidden = true;
        }
    }

    class NOPFourArgBlock extends FlowBlock {
        constructor() {
            super("nopFourArgBlock", _("unknown"));
            this.setPalette("extras", activity);
            this.setHelpString();
            this.formBlock({
                args: 4,
                argTypes: ["anyin", "anyin", "anyin", "anyin"]
            });
            this.hidden = true;
        }
    }

    new SaveABCBlock().setup(activity);
    new SaveLilypondBlock().setup(activity);
    new SaveSVGBlock().setup(activity);
    new NoBackgroundBlock().setup(activity);
    new ShowBlocksBlock().setup(activity);
    new HideBlocksBlock().setup(activity);
    new FloatToStringBlock().setup(activity);
    new DrumBlock().setup(activity);
    new DisplayGridBlock().setup(activity);
    new GridBlock().setup(activity);
    new VSpaceBlock().setup(activity);
    new HSpaceBlock().setup(activity);
    new WaitBlock().setup(activity);
    new CommentBlock().setup(activity);
    new PrintBlock().setup(activity);
    // NOP blocks
    new NOPValueBlock().setup(activity);
    new NOPOneArgMathBlock().setup(activity);
    new NOPTwoArgMathBlock().setup(activity);
    new NOPZeroArgBlock().setup(activity);
    new NOPOneArgBlock().setup(activity);
    new NOPTwoArgBlock().setup(activity);
    new NOPThreeArgBlock().setup(activity);
    new NOPFourArgBlock().setup(activity);
}
