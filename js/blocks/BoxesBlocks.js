function setupBoxesBlocks() {
    class IncrementBlock extends FlowBlock {
        constructor(name) {
            super(name || "increment");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            if (beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _("The Add-to block is used to add to the value stored in a box."),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Add-to block is used to add to the value stored in a box.") +
                        " " +
                        _("It can also be used with other blocks such as Color and Pen size."),
                    "documentation",
                    ""
                ]);
            }

            this.formBlock({
                name: _("add"),
                args: 2,
                argLabels: [_("to"), this.lang === "ja" ? _("value1") : _("value")],
                argTypes: ["anyin", "anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            // If the 2nd arg is not set, default to 1.
            const i = args.length === 2 ? args[1] : 1;

            if (args.length > 0) {
                const cblk = logo.blocks.blockList[blk].connections[1];

                if (logo.blocks.blockList[cblk].name === "text") {
                    // Work-around to #1302
                    // Look for a namedbox with this text value.
                    const name = logo.blocks.blockList[cblk].value;
                    if (name in logo.boxes) {
                        logo.boxes[name] = logo.boxes[name] + i;
                        return;
                    }
                }

                let value = args[0] + i;

                // A special case for solfege stored in boxes.
                if (logo.blocks.blockList[cblk].name === "namedbox") {
                    let j = SOLFEGENAMES.indexOf(logo.blocks.blockList[cblk].value);
                    if (j !== -1) {
                        j = j >= SOLFEGENAMES.length ? 0 : j;
                        value = SOLFEGENAMES[j + i];
                    }
                }

                try {
                    logo.blocks.blockSetter(logo, cblk, value, turtle);
                } catch (e) {
                    logo.errorMsg(_("Block does not support incrementing."), cblk);
                }
            }
        }
    }

    class IncrementOneBlock extends IncrementBlock {
        constructor() {
            super("incrementOne");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Add-1-to block adds one to the value stored in a box."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("add 1 to"),
                args: 1,
                argTypes: ["anyin"],
                argLabels: [""]
            });
        }

        flow(args, logo, turtle, blk) {
            args[1] = 1;
            super.flow(args, logo, turtle, blk);
        }
    }

    class DecrementOneBlock extends IncrementBlock {
        constructor() {
            super("decrementOne");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Subtract-1-from block subtracts one from the value stored in a box."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("subtract 1 from"),
                args: 1,
                argTypes: ["anyin"],
                argLabels: [""]
            });
        }

        flow(args, logo, turtle, blk) {
            args[1] = -1;
            super.flow(args, logo, turtle, blk);
        }
    }

    class BoxBlock extends LeftBlock {
        constructor() {
            super("box");
            this.setPalette("boxes");
            this.parameter = true;
            this.setHelpString([
                _("The Box block returns the value stored in a box."),
                "documentation",
                null,
                "box1help"
            ]);

            this.formBlock({
                //.TRANS: a container into which to put something
                name: _("box"),
                outType: "anyout",
                args: 1,
                defaults: [_("box")],
                argTypes: ["anyin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            const cblk = logo.blocks.blockList[blk].connections[1];
            const boxname = logo.parseArg(that, turtle, cblk, blk, logo.receivedArg);
            if (boxname in logo.boxes) {
                return logo.boxes[boxname];
            } else {
                logo.errorMsg(NOBOXERRORMSG, blk, boxname);
                return 0;
            }
        }

        setter(logo, value, turtle, blk) {
            const cblk = logo.blocks.blockList[blk].connections[1];
            const name = logo.parseArg(logo, turtle, cblk, blk, logo.receivedArg);
            if (name in logo.boxes) {
                logo.boxes[name] = value;
            } else {
                logo.errorMsg(NOBOXERRORMSG, blk, name);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            const name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            if (name in logo.boxes) {
                return logo.boxes[name];
            } else {
                logo.errorMsg(NOBOXERRORMSG, blk, name);
                return 0;
            }
        }
    }

    class NamedBoxBlock extends ValueBlock {
        constructor() {
            super("namedbox");
            this.setPalette("boxes");
            this.beginnerBlock(true);
            this.parameter = true;
            this.setHelpString([
                _("The Box block returns the value stored in a box."),
                "documentation",
                ""
            ]);

            this.extraWidth = 20;
            this.formBlock({
                name: _("box"),
                outType: "anyout"
            });
        }

        updateParameter(logo, turtle, blk) {
            const name = logo.blocks.blockList[blk].privateData;
            if (name in logo.boxes) {
                return logo.boxes[name];
            } else {
                logo.errorMsg(NOBOXERRORMSG, blk, name);
                return 0;
            }
        }

        setter(logo, value, turtle, blk) {
            const name = logo.blocks.blockList[blk].privateData;
            if (name in logo.boxes) {
                logo.boxes[name] = value;
            } else {
                logo.errorMsg(NOBOXERRORMSG, blk, name);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const name = logo.blocks.blockList[blk].privateData;
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
            } else if (!logo.updatingStatusMatrix) {
                if (name in logo.boxes) {
                    return logo.boxes[name];
                } else {
                    logo.errorMsg(NOBOXERRORMSG, blk, name);
                    return 0;
                }
            }
        }
    }

    class StoreIn2Block extends FlowBlock {
        constructor() {
            super("storein2");
            this.setPalette("boxes");
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Store in block will store a value in a box."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("store in box"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [4]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length !== 1) return;
            logo.boxes[logo.blocks.blockList[blk].privateData] = args[0];
        }
    }

    class StoreInBlock extends FlowBlock {
        constructor() {
            super("storein");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Store in block will store a value in a box."),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: put something into a container for later reference
                name: _("store in"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                defaults: [_("box"), 4],
                //.TRANS: name1 is name as in name of box, value1 is value as in the numeric value stored in a box (JAPANESE ONLY)
                argLabels: this.lang === "ja" ? [_("name1"), _("value1")] : [_("name"), _("value")]
            });
        }

        flow(args, logo) {
            if (args.length !== 2) return;
            logo.boxes[args[0]] = args[1];
        }
    }

    class Box2Block extends ValueBlock {
        constructor() {
            super("box2");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Box2 block returns the value stored in Box2."),
                "documentation",
                null,
                "box2help"
            ]);

            this.formBlock({ name: _("box2") });
            this.makeMacro((x, y) => [[0, ["namedbox", { value: "box2" }], x, y, [null]]]);
        }
    }

    class StoreBox2Block extends FlowBlock {
        constructor() {
            super("storebox2");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Store in Box2 block is used to store a value in Box2."),
                "documentation",
                null,
                "box2help"
            ]);

            this.formBlock({
                name: _("store in box2"),
                args: 1,
                defaults: [4]
            });
            this.makeMacro((x, y) => [
                [0, ["storein2", { value: "box2" }], x, y, [null, 1, null]],
                [1, ["number", { value: 4 }], x, y, [0]]
            ]);
        }
    }

    class Box1Block extends ValueBlock {
        constructor() {
            super("box1");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Box1 block returns the value stored in Box1."),
                "documentation",
                null,
                "box1help"
            ]);

            this.formBlock({ name: _("box1") });
            this.makeMacro((x, y) => [[0, ["namedbox", { value: "box1" }], x, y, [null]]]);
        }
    }

    class StoreBox1Block extends FlowBlock {
        constructor() {
            super("storebox1");
            this.setPalette("boxes");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Store in Box1 block is used to store a value in Box1."),
                "documentation",
                null,
                "box1help"
            ]);

            this.formBlock({
                name: _("store in box1"),
                args: 1,
                defaults: [4]
            });
            this.makeMacro((x, y) => [
                [0, ["storein2", { value: "box1" }], x, y, [null, 1, null]],
                [1, ["number", { value: 4 }], x, y, [0]]
            ]);
        }
    }

    new DecrementOneBlock().setup();
    new IncrementOneBlock().setup();
    new IncrementBlock().setup();
    new BoxBlock().setup();
    new NamedBoxBlock().setup();
    new StoreIn2Block().setup();
    new StoreInBlock().setup();
    new Box2Block().setup();
    new StoreBox2Block().setup();
    new Box1Block().setup();
    new StoreBox1Block().setup();
}
