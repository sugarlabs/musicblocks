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
            let cblk = logo.blocks.blockList[blk].connections[1];
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

    class OpenPaletteBlock extends FlowBlock {
        constructor() {
            super("openpalette");
            this.setPalette("extras");
            this.setHelpString([
                _("The Open palette block opens a palette."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("open palette"),
                args: 1,
                argTypes: ["textin"],
                defaults: [_("rhythm")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 1) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            for (let p in logo.blocks.palettes.dict) {
                if (
                    _(logo.blocks.palettes.dict[p].name) ===
                    args[0].toLowerCase()
                ) {
                    logo.blocks.palettes.hide();
                    logo.blocks.palettes.dict[p].show();
                    logo.blocks.palettes.show();
                    return;
                }
            }
        }
    }

    class DeleteBlockBlock extends FlowBlock {
        constructor() {
            super("deleteblock");
            this.setPalette("extras");
            this.setHelpString([
                _("The Delete block block removes a block."),
                "documentation",
                "",
                "deletehelp"
            ]);

            this.formBlock({
                //.TRANS: Move this block to the trash.
                name: _("delete block"),
                args: 1
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 1) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            }

            if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            // Is the block already in the trash?
            if (logo.blocks.blockList[args[0]].trash) {
                return;
            }

            // Disconnect the block.
            let c = logo.blocks.blockList[args[0]].connections[0];
            logo.blocks.blockList[args[0]].connections[0] = null;
            if (c !== null) {
                for (
                    let i = 0;
                    i < logo.blocks.blockList[c].connections.length;
                    i++
                ) {
                    if (logo.blocks.blockList[c].connections[i] === args[0]) {
                        logo.blocks.blockList[c].connections[i] = null;
                    }
                }
            }

            // Send it to the trash.
            logo.blocks.sendStackToTrash(logo.blocks.blockList[args[0]]);

            // And adjust the docs of the former connection
            logo.blocks.adjustDocks(c, true);
        }
    }

    class MoveBlockBlock extends FlowBlock {
        constructor() {
            super("moveblock");
            this.setPalette("extras");
            this.setHelpString([
                _("The Move block block moves a block."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Move the position of a block on the screen.
                name: _("move block"),
                args: 3,
                argLabels: [_("block number"), _("x"), _("y")]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 3) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let x = logo.turtles.turtleX2screenX(args[1]);
            let y = logo.turtles.turtleY2screenY(args[2]);
            logo.blocks.moveBlock(args[0], x, y);
        }
    }

    class RunBlockBlock extends FlowBlock {
        constructor() {
            super("runblock");
            this.setPalette("extras");
            this.setHelpString([
                _(
                    "The Run block block runs a block. It accepts two types of arguments: block number or block name."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Run program beginning at this block.
                name: _("run block"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [0]
            });
        }

        flow(args, logo, turtle, blk, receivedArg) {
            if (args.length < 1) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (typeof args[0] === "string") {
                // Look for a block with logo name
                for (let i = 0; i < logo.blocks.blockList.length; i++) {
                    if (
                        logo.blocks.blockList[i].protoblock.staticLabels
                            .length > 0 &&
                        logo.blocks.blockList[i].protoblock.staticLabels[0] ===
                            args[0]
                    ) {
                        args[0] = i;
                        return;
                    }
                }
            }

            if (typeof args[0] === "string") {
                args[0] = -1;
            }

            if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (logo.blocks.blockList[args[0]].name === "start") {
                let thisTurtle = logo.blocks.blockList[args[0]].value;
                let tur = logo.turtles.ithTurtle(thisTurtle);
                console.debug("run start " + thisTurtle);

                logo.initTurtle(thisTurtle);
                tur.queue = [];
                tur.parentFlowQueue = [];
                tur.unhighlightQueue = [];
                tur.parameterQueue = [];
                tur.running = true;
                logo.runFromBlock(logo, thisTurtle, args[0], 0, receivedArg);
            } else {
                return [args[0], 1];
            }
        }
    }

    class DockBlockBlock extends FlowBlock {
        constructor() {
            super("dockblock");
            this.setPalette("extras");
            this.setHelpString([
                _("The Dock block block connections two blocks."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: We can connect a block to another block.
                name: _("connect blocks"),
                args: 3,
                argLabels: [
                    _("target block"),
                    _("connection number"),
                    _("block number")
                ]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length < 3) {
                console.debug(args.length + " < 3");
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
                console.debug(
                    args[0] + " > " + logo.blocks.blockList.length - 1
                );
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[0] === args[2]) {
                console.debug(args[0] + " == " + args[2]);
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[2] < 0 || args[2] > logo.blocks.blockList.length - 1) {
                console.debug(
                    args[2] + " > " + logo.blocks.blockList.length - 1
                );
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (args[1] === -1) {
                // Find the last connection.
                args[1] = logo.blocks.blockList[args[0]].connections.length - 1;
            } else if (
                args[1] < 1 ||
                args[1] > logo.blocks.blockList[args[0]].connections.length - 1
            ) {
                console.debug(args[1] + " out of bounds");
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            // Make sure there is not another block already connected.
            let c = logo.blocks.blockList[args[0]].connections[args[1]];
            if (c !== null) {
                if (logo.blocks.blockList[c].name === "hidden") {
                    // Dock to the hidden block.
                    args[0] = c;
                    args[1] = 1;
                } else {
                    // Or disconnection the old connection.
                    for (
                        let i = 0;
                        i < logo.blocks.blockList[c].connections.length;
                        i++
                    ) {
                        if (
                            logo.blocks.blockList[c].connections[i] === args[0]
                        ) {
                            logo.blocks.blockList[c].connections[i] = null;
                            return;
                        }
                    }

                    logo.blocks.blockList[args[0]].connections[args][1] = null;
                }
            }

            logo.blocks.blockList[args[0]].connections[args[1]] = args[2];
            logo.blocks.blockList[args[2]].connections[0] = args[0];

            logo.blocks.adjustDocks(args[0], true);
        }
    }

    class MakeBlockBlock extends LeftBlock {
        constructor() {
            super("makeblock");
            this.setPalette("extras");
            this.setHelpString([
                _("The Make block block creates a new block."),
                "documentation",
                "",
                "makehelp"
            ]);

            this.formBlock({
                //.TRANS: Create a new block programmatically.
                name: _("make block"),
                args: 1,
                argTypes: ["anyin"],
                outType: "numberout",
                flows: {
                    type: "arg",
                    types: ["anyin"],
                    labels: [""]
                },
                defaults: [_("note")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            logo.blocks.showBlocks();   // Force blocks to be visible.
            let blockArgs = [null];
            if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    let i = 0;
                    i < logo.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
                    let t = logo.parseArg(
                        logo,
                        turtle,
                        logo.blocks.blockList[blk].connections[i + 2],
                        blk,
                        receivedArg
                    );
                    blockArgs.push(t);
                }
            }
            let cblk = logo.blocks.blockList[blk].connections[1];
            let name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            let blockNumber = logo.blocks.blockList.length;

            let x = logo.turtles.turtleX2screenX(
                logo.turtles.turtleList[turtle].x
            );
            let y = logo.turtles.turtleY2screenY(
                logo.turtles.turtleList[turtle].y
            );

            // We need to wait for the new block to load before continuing.
            logo.doWait(turtle, 1);

            // We special case note blocks.
            //.TRANS: a musical note consisting of pitch and duration
            if (name === _("note")) {
                let p, o, v;
                switch (blockArgs.length) {
                    case 1:
                        p = "sol";
                        o = 4;
                        v = 4;
                        break;
                    case 2:
                        p = blockArgs[1];
                        o = 4;
                        v = 4;
                        break;
                    case 3:
                        p = blockArgs[1];
                        o = blockArgs[2];
                        v = 4;
                        break;
                    default:
                        p = blockArgs[1];
                        o = blockArgs[2];
                        v = blockArgs[3];
                        break;
                }

                let newNote = [
                    [0, "newnote", x, y, [null, 1, 4, 8]],
                    [1, "divide", 0, 0, [0, 2, 3]],
                    [2, ["number", { value: 1 }], 0, 0, [1]],
                    [3, ["number", { value: v }], 0, 0, [1]],
                    [4, "vspace", 0, 0, [0, 5]],
                    [5, "pitch", 0, 0, [4, 6, 7, null]],
                    [6, ["solfege", { value: p }], 0, 0, [5]],
                    [7, ["number", { value: o }], 0, 0, [5]],
                    [8, "hidden", 0, 0, [0, null]]
                ];
                logo.blocks.loadNewBlocks(newNote);
                console.debug("BLOCKNUMBER " + blockNumber);
                return blockNumber;
            } else if (name === _("start")) {
                let newBlock = [[0, "start", x, y, [null, null, null]]];
                logo.blocks.loadNewBlocks(newBlock);
                console.debug("BLOCKNUMBER " + blockNumber);
                return blockNumber;
            } else if (name === _("silence")) {
                // FIXME: others too
                let newBlock = [[0, "rest2", x, y, [null, null]]];
                logo.blocks.loadNewBlocks(newBlock);
                console.debug("BLOCKNUMBER " + blockNumber);
                return blockNumber;
            } else {
                let obj = logo.blocks.palettes.getProtoNameAndPalette(name);
                let protoblk = obj[0];
                let protoName = obj[2];
                if (protoblk === null) {
                    logo.errorMsg(_("Cannot find block") + " " + name);
                    console.debug("Cannot find block " + name);
                    return 0;
                } else {
                    let newBlock = [[0, protoName, x, y, [null]]];
                    for (
                        let i = 1;
                        i <
                        logo.blocks.protoBlockDict[protoblk].dockTypes.length;
                        i++
                    ) {
                        // FIXME: type check args
                        if (i < blockArgs.length) {
                            if (typeof blockArgs[i] === "number") {
                                if (
                                    ["anyin", "numberin"].indexOf(
                                        logo.blocks.protoBlockDict[protoblk]
                                            .dockTypes[i]
                                    ) === -1
                                ) {
                                    logo.errorMsg(
                                        _(
                                            "Warning: block argument type mismatch"
                                        )
                                    );
                                }
                                newBlock.push([
                                    i,
                                    ["number", { value: blockArgs[i] }],
                                    0,
                                    0,
                                    [0]
                                ]);
                            } else if (typeof blockArgs[i] === "string") {
                                if (
                                    ["anyin", "textin"].indexOf(
                                        logo.blocks.protoBlockDict[protoblk]
                                            .dockTypes[i]
                                    ) === -1
                                ) {
                                    logo.errorMsg(
                                        _(
                                            "Warning: block argument type mismatch"
                                        )
                                    );
                                }
                                newBlock.push([
                                    i,
                                    ["string", { value: blockArgs[i] }],
                                    0,
                                    0,
                                    [0]
                                ]);
                            } else {
                                newBlock[0][4].push(null);
                            }

                            newBlock[0][4].push(i);
                        } else {
                            newBlock[0][4].push(null);
                        }
                    }

                    logo.blocks.loadNewBlocks(newBlock);
                    console.debug("BLOCKNUMBER " + blockNumber);
                    return blockNumber;
                }
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
                _(
                    "The No background block eliminates the background from the saved SVG output."
                ),
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
            this.setHelpString([
                _("The Show blocks block shows the blocks."),
                "documentation",
                ""
            ]);
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
            this.setHelpString([
                _("The Hide blocks block hides the blocks."),
                "documentation",
                ""
            ]);
        }

        flow(args, logo) {
            blocks.hideBlocks();
            logo.showBlocksAfterRun = false;
            logo.turtleDelay = 0;
        }
    }

    class OpenProjectBlock extends FlowBlock {
        constructor() {
            super("openProject");
            this.setPalette("extras");
            this.setHelpString([
                _(
                    "The Open project block is used to open a project from a web page."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("open project"),
                args: 1,
                argTypes: ["textin"],
                defaults: ["url"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            url = args[0];

            function ValidURL(str) {
                let pattern = new RegExp(
                    "^(https?:\\/\\/)?" + // protocol
                    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
                    "((\\d{1,3}\\.) {3}\\d{1,3}))" + // OR ip (v4) address
                    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
                    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                        "(\\#[-a-z\\d_]*)?$",
                    "i"
                ); // fragment locator
                if (!pattern.test(str)) {
                    logo.errorMsg(_("Please enter a valid URL."));
                    return false;
                } else {
                    return true;
                }
            }

            if (ValidURL(url)) {
                let win = window.open(url, "_blank");
                if (win) {
                    // Browser has allowed it to be opened.
                    win.focus();
                } else {
                    // Broswer has blocked it.
                    alert("Please allow popups for this site");
                }
            }
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
            let cblk = logo.blocks.blockList[blk].connections[1];
            return logo.parseArg(logo, turtle, cblk, blk, receivedArg);
        }
    }

    class WaitBlock extends FlowBlock {
        constructor() {
            super("wait", _("wait"));
            this.setPalette("extras");
            this.setHelpString([
                _(
                    "The Wait block pauses the program for a specified number of seconds."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                defaults: [1]
            });
        }

        flow(args, logo, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (args.length === 1) {
                let bpmFactor =
                    TONEBPM / tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM;

                let noteBeatValue = bpmFactor / (1 / args[0]);
                tur.singer.previousTurtleTime = tur.singer.turtleTime;
                tur.singer.turtleTime += noteBeatValue;
                logo.doWait(turtle, args[0]);
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
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (!logo.inStatusMatrix) {
                if (args.length === 1) {
                    if (args[0] !== null) {
                        let tur = logo.turtles.ithTurtle(turtle);

                        if (!tur.singer.suppressOutput) {
                            if (args[0] === undefined) {
                                logo.textMsg("undefined");
                            } else if (args[0] === null) {
                                logo.textMsg("null");
                            } else {
                                logo.textMsg(args[0].toString());
                            }
                        } else if (logo.runningLilypond) {
                            if (logo.inNoteBlock[turtle].length > 0) {
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
                argTypes: ["gridin"],
            });
            this.makeMacro((x, y) => [
                [0, "displaygrid", x, y, [null, 1, null]],
                [1, ["grid", { value: "Cartesian" }], 0, 0, [0]],
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (!args || !args[0]){
                args = ["Cartesian"];
            }
            let act = logo.blocks.activity ;
            logo.turtles.hideGrids() ;
            switch (args[0]){
                case (_("Cartesian")) :
                    act._showCartesian();
                    break;
                case (_("polar")) :
                    act._showPolar();
                    break;
                case (_("Cartesian+polar")) :
                    act._showPolar();
                    act._showCartesian();
                    break;
                case (_("treble")) :
                     act._showTreble();
                     break;
                case (_("grand staff")) :
                    act._showGrand();
                    break;
                case (_("mezzo-soprano")):
                    act._showSoprano();
                    break;
                case (_("alto")) :
                     act._showAlto();
                     break;
                case (_("tenor")) :
                    act._showTenor();
                    break;
                case (_("bass")) :
                    act._showBass();
                    break;
                case (_("none")) :
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

    new OpenPaletteBlock().setup();
    new DeleteBlockBlock().setup();
    new MoveBlockBlock().setup();
    new RunBlockBlock().setup();
    new DockBlockBlock().setup();
    new MakeBlockBlock().setup();
    new SaveABCBlock().setup();
    new SaveLilypondBlock().setup();
    new SaveSVGBlock().setup();
    new NoBackgroundBlock().setup();
    new ShowBlocksBlock().setup();
    new HideBlocksBlock().setup();
    new OpenProjectBlock().setup();
    new FloatToStringBlock().setup();
    new DrumBlock().setup();
    new GridBlock().setup();
    new DisplayGridBlock().setup();
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
