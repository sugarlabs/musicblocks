function setupBooleanBlocks() {
    class NotBlock extends BooleanBlock {
        constructor() {
            super("not");
            this.setPalette("boolean");
            this.setHelpString([
                _("The Not block is the logical not operator."),
                "documentation",
                ""
            ]);
            this.parameter = true;
            this.formBlock({
                name: _("not"),
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            try {
                return !a;
            } catch (e) {
                console.debug(e);
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class AndBlock extends BooleanBlock {
        constructor() {
            super("and");
            this.setPalette("boolean");
            this.setHelpString([
                _("The And block is the logical and operator."),
                "documentation",
                ""
            ]);
            this.parameter = true;
            this.formBlock({
                name: _("and"),
                args: 2,
                argTypes: ["booleanin", "booleanin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            } else {
                const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                return a && b;
            }
        }
    }

    class OrBlock extends BooleanBlock {
        constructor() {
            super("or");
            this.setPalette("boolean");
            this.setHelpString([
                _("The Or block is the logical or operator."),
                "documentation",
                ""
            ]);
            this.parameter = true;
            this.formBlock({
                name: _("or"),
                args: 2,
                argTypes: ["booleanin", "booleanin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            } else {
                const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                return a || b;
            }
        }
    }

    class XorBlock extends BooleanBlock {
        constructor() {
            super("xor");
            this.setPalette("boolean");
            this.setHelpString([
                _("The XOR block is the logical XOR operator."),
                "documentation",
                ""
            ]);
            this.parameter = true;
            this.formBlock({
                name: _("xor"),
                args: 2,
                argTypes: ["booleanin", "booleanin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            } else {
                const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                return ((a && !b)||(!a && b));
            }
        }
    }

    class GreaterBlock extends BooleanBlock {
        constructor() {
            super("greater");
            this.setPalette("boolean");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Greater-than block returns True if the top number is greater than the bottom number."
                ),
                "documentation",
                ""
            ]);
            this.fontsize = 14;
            this.parameter = true;
            this.formBlock({
                name: ">",
                args: 2,
                argTypes: ["numberin", "numberin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            try {
                return Number(a) > Number(b);
            } catch (e) {
                console.debug(e);
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class LessBlock extends BooleanBlock {
        constructor() {
            super("less");
            this.setPalette("boolean");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Less-than block returns True if the top number is less than the bottom number."
                ),
                "documentation",
                ""
            ]);
            this.fontsize = 14;
            this.parameter = true;
            this.formBlock({
                name: "<",
                args: 2,
                argTypes: ["numberin", "numberin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            try {
                return Number(a) < Number(b);
            } catch (e) {
                console.debug(e);
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class EqualBlock extends BooleanBlock {
        constructor() {
            super("equal");
            this.setPalette("boolean");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Equal block returns True if the two numbers are equal."),
                "documentation",
                ""
            ]);
            this.fontsize = 14;
            this.parameter = true;
            this.formBlock({
                name: "=",
                args: 2,
                argTypes: ["anyin", "anyin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (logo.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            try {
                return a === b;
            } catch (e) {
                console.debug(e);
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class StaticBooleanBlock extends BooleanBlock {
        constructor() {
            super("boolean");
            this.setPalette("boolean");
            this.setHelpString([
                _("The Boolean block is used to specify true or false."),
                "documentation",
                ""
            ]);
        }

        arg(logo, turtle, blk) {
            if (typeof logo.blocks.blockList[blk].value === "string") {
                return (
                    logo.blocks.blockList[blk].value === _("true") ||
                    logo.blocks.blockList[blk].value === "true"
                );
            }
            return logo.blocks.blockList[blk].value;
        }
    }

    new NotBlock().setup();
    new XorBlock().setup();
    new AndBlock().setup();
    new OrBlock().setup();
    new GreaterBlock().setup();
    new LessBlock().setup();
    new EqualBlock().setup();
    new StaticBooleanBlock().setup();
}
