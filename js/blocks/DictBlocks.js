function setupDictBlocks() {
    class ShowDictBlock extends FlowBlock {
        constructor() {
            super("showDict");
            this.setPalette("dictionary");
	    this.hidden = this.deprecated = true;
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Show-dictionary block displays the contents of the dictionary at the top of the screen."
                ),
                "documentation",
                "",
            ]);

            this.formBlock({
                //.TRANS: Display the dictionary contents
                name: _("show dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")],
            });
        }

        flow(args, logo, turtle) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            Turtle.DictActions.showDict(args[0], turtle);
        }
    }

    class DictBlock extends LeftBlock {
        constructor() {
            super("dictionary");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Dictionary block returns a dictionary."),
                "documentation",
                "",
            ]);

            this.formBlock({
                name: _("dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")],
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                return Turtle.DictActions.SerializeDict(target, turtle);
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            return JSON.stringify(logo.turtleDicts[turtle][a]);
        }
    }

    class GetDictBlock extends LeftBlock {
        constructor() {
            super("getDict");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Get-dict block returns a value in the dictionary for a specified key."),
                "documentation",
                "",
            ]);

            labels: [this.lang === "js" ? _("do2") : _("do")];
            this.formBlock({
                //.TRANS: retrieve a value from the dictionary with a given key
                name: _("get value"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [_("name"), this.lang === "ja" ? _("key2") : _("key")],
                defaults: [_("My Dictionary"), this.lang === "ja" ? _("key2") : _("key")],
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            let cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            let a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            let k = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            return Turtle.DictActions.getValue(a, k, turtle);
        }
    }

    class SetDictBlock extends FlowBlock {
        constructor() {
            super("setDict");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set-dict block sets a value in the dictionary for a specified key."),
                "documentation",
                "",
            ]);

            this.formBlock({
                //.TRANS: set a value in the dictionary for a given key
                name: _("set value"),
                args: 3,
                argTypes: ["anyin", "anyin", "anyin"],
                argLabels: [_("name"), this.lang === "ja" ? _("key2") : _("key"), _("value")],
                defaults: [_("My Dictionary"), this.lang === "ja" ? _("key2") : _("key"), 0],
            });
        }

        flow(args, logo, turtle) {
            if (args[0] === null || args[1] === null || args[2] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            Turtle.DictActions.setValue(...args, turtle);
        }
    }

    class GetDictBlock2 extends LeftBlock {
        constructor() {
            super("getDict2");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Get-dict block returns a value in the dictionary for a specified key."),
                "documentation",
                "",
            ]);

            this.formBlock({
                //.TRANS: retrieve a value from the dictionary with a given key
                name: _("get value"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [this.lang === "ja" ? _("key2") : _("key")],
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            let a = turtles.ithTurtle(turtle).name;
            let k = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

            return Turtle.DictActions.getValue(a, k, turtle);
        }
    }

    class SetDictBlock2 extends FlowBlock {
        constructor() {
            super("setDict2");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set-dict block sets a value in the dictionary for a specified key."),
                "documentation",
                "",
            ]);

            this.formBlock({
                //.TRANS: set a value in the dictionary for a given key
                name: _("set value"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [this.lang === "ja" ? _("key2") : _("key"), _("value")],
                defaults: [this.lang === "ja" ? _("key2") : _("key"), 0],
            });
        }

        flow(args, logo, turtle) {
            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            Turtle.DictActions.setValue(turtles.ithTurtle(turtle).name, ...args, turtle);
        }
    }

    new DictBlock().setup();
    new ShowDictBlock().setup();
    new SetDictBlock().setup();
    new GetDictBlock().setup();
    new SetDictBlock2().setup();
    new GetDictBlock2().setup();
}
