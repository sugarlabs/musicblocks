function setupExtrasBlocks() {
    class FloatToStringBlock extends LeftBlock {
        constructor() {
            super("float2string", _("fraction"));
            this.setPalette("extras");
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
            const cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
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
                logo.errorMsg(NANERRORMSG, blk);
                return "0/1";
            }
        }
    }

    class SaveABCBlock extends FlowBlock {
        constructor() {
            super("saveabc");
            this.setPalette("extras");
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
                save.afterSaveAbc(args[0]);
            }
        }
    }

    class SaveLilypondBlock extends FlowBlock {
        constructor() {
            super("savelilypond");
            this.setPalette("extras");
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
                save.afterSaveLilypond(args[0]);
            }
        }
    }

    class SaveSVGBlock extends FlowBlock {
        constructor() {
            super("savesvg");
            this.setPalette("extras");
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
                logo.errorMsg(NOINPUTERRORMSG, blk);
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
                        body.style.background +
                        '"/> ' +
                        logo.svgOutput;
                }

                save.saveSVG(args[0]);
            }
        }
    }

    class NoBackgroundBlock extends FlowBlock {
        constructor() {
            super("nobackground", _("no background"));
            this.setPalette("extras");
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
            this.setPalette("extras");
            this.setHelpString([_("The Show blocks block shows the blocks."), "documentation", ""]);
        }

        flow(args, logo) {
            logo.blocks.showBlocks();
            logo.turtleDelay = DEFAULTDELAY;
        }
    }

    class HideBlocksBlock extends FlowBlock {
        constructor() {
            super("hideblocks", _("hide blocks"));
            this.setPalette("extras");
            this.setHelpString([_("The Hide blocks block hides the blocks."), "documentation", ""]);
        }

        flow(args, logo) {
            blocks.hideBlocks();
            logo.showBlocksAfterRun = false;
            logo.turtleDelay = 0;
        }
    }

    class VSpaceBlock extends FlowBlock {
        constructor() {
            super("vspace", "↓");
            this.setPalette("extras");
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
            this.setPalette("extras");
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
            const cblk = logo.blocks.blockList[blk].connections[1];
            return logo.parseArg(logo, turtle, cblk, blk, receivedArg);
        }
    }

    class WaitBlock extends FlowBlock {
        constructor() {
            super("wait", _("wait"));
            this.setPalette("extras");
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
            const tur = logo.turtles.ithTurtle(turtle);

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
            this.setPalette("extras");
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
                console.debug(args[0].toString());
                if (!logo.turtles.ithTurtle(turtle).singer.suppressOutput && logo.turtleDelay > 0) {
                    logo.textMsg(args[0].toString());
                }
            }
        }
    }

    class PrintBlock extends FlowBlock {
        constructor() {
            super("print", _("print"));
            if (beginnerMode) this.setPalette("media");
            else this.setPalette("extras");

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
            const cblk = logo.blocks.blockList[blk].connections[1];
            if (logo.inOscilloscope && cblk !== null) {
                const name = logo.blocks.blockList[cblk].value;
                let turtle = -1;
                for (let i = 0; i < logo.turtles.turtleList.length; i++) {
                    if (!logo.turtles.turtleList[i].inTrash) {
                        const turtleName = turtles.turtleList[i].name;
                        if (turtleName === name) turtle = i;
                    }
                }
                if (
                    turtle > -1 &&
                    logo.oscilloscopeTurtles.indexOf(logo.turtles.turtleList[turtle]) < 0
                )
                    logo.oscilloscopeTurtles.push(logo.turtles.turtleList[turtle]);
            } else if (!logo.inStatusMatrix) {
                if (args.length === 1) {
                    if (args[0] !== null) {
                        const tur = logo.turtles.ithTurtle(turtle);

                        if (!tur.singer.suppressOutput) {
                            if (logo.blocks.blockList[cblk].name === "grid") {
                                const temp = new DisplayGridBlock();
                                temp.flow(args, logo, turtle, blk);
                            } else if (args[0] === undefined) {
                                logo.textMsg("undefined");
                            } else if (args[0] === null) {
                                logo.textMsg("null");
                            } else {
                                logo.textMsg(args[0].toString());
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
            this.setPalette("extras");
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
            this.setPalette("extras");
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

        flow(args, logo, turtle, blk) {
            if (!args || !args[0]) {
                args = ["Cartesian"];
            }
            const act = logo.blocks.activity;
            logo.turtles.hideGrids();
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
            this.setPalette("extras");
            this.setHelpString();
            this.formBlock({ outType: "gridout" });
        }
    }

    // NOP blocks (used as placeholders when loaded blocks not found)
    class NOPValueBlock extends ValueBlock {
        constructor() {
            super("nopValueBlock", _("unknown"));
            this.setPalette("extras");
            this.setHelpString();
            this.formBlock({ outType: "anyout" });
            this.hidden = true;
        }
    }

    class NOPOneArgMathBlock extends LeftBlock {
        constructor() {
            super("nopOneArgMathBlock", _("unknown"));
            this.setPalette("extras");
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
            this.setPalette("extras");
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
            this.setPalette("extras");
            this.setHelpString();
            this.hidden = true;
        }
    }

    class NOPOneArgBlock extends FlowBlock {
        constructor() {
            super("nopOneArgBlock", _("unknown"));
            this.setPalette("extras");
            this.setHelpString();
            this.formBlock({ args: 1, argTypes: ["anyin"] });
            this.hidden = true;
        }
    }

    class NOPTwoArgBlock extends FlowBlock {
        constructor() {
            super("nopTwoArgBlock", _("unknown"));
            this.setPalette("extras");
            this.setHelpString();
            this.formBlock({ args: 2, argTypes: ["anyin", "anyin"] });
            this.hidden = true;
        }
    }

    class NOPThreeArgBlock extends FlowBlock {
        constructor() {
            super("nopThreeArgBlock", _("unknown"));
            this.setPalette("extras");
            this.setHelpString();
            this.formBlock({ args: 3, argTypes: ["anyin", "anyin", "anyin"] });
            this.hidden = true;
        }
    }

    class NOPFourArgBlock extends FlowBlock {
        constructor() {
            super("nopFourArgBlock", _("unknown"));
            this.setPalette("extras");
            this.setHelpString();
            this.formBlock({
                args: 4,
                argTypes: ["anyin", "anyin", "anyin", "anyin"]
            });
            this.hidden = true;
        }
    }

    new SaveABCBlock().setup();
    new SaveLilypondBlock().setup();
    new SaveSVGBlock().setup();
    new NoBackgroundBlock().setup();
    new ShowBlocksBlock().setup();
    new HideBlocksBlock().setup();
    new FloatToStringBlock().setup();
    new DrumBlock().setup();
    new DisplayGridBlock().setup();
    new GridBlock().setup();
    new VSpaceBlock().setup();
    new HSpaceBlock().setup();
    new WaitBlock().setup();
    new CommentBlock().setup();
    new PrintBlock().setup();
    // NOP blocks
    new NOPValueBlock().setup();
    new NOPOneArgMathBlock().setup();
    new NOPTwoArgMathBlock().setup();
    new NOPZeroArgBlock().setup();
    new NOPOneArgBlock().setup();
    new NOPTwoArgBlock().setup();
    new NOPThreeArgBlock().setup();
    new NOPFourArgBlock().setup();
}
