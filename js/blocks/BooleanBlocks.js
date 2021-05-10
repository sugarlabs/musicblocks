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

   _, BooleanBlock, NOINPUTERRORMSG
*/

/* exported setupBooleanBlocks */

function setupBooleanBlocks(activity) {
    class NotBlock extends BooleanBlock {
        constructor() {
            super("not");
            this.setPalette("boolean", activity);
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
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            try {
                return !a;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class AndBlock extends BooleanBlock {
        constructor() {
            super("and");
            this.setPalette("boolean", activity);
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
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
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
            this.setPalette("boolean", activity);
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
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
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
            this.setPalette("boolean", activity);
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
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
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
            this.setPalette("boolean", activity);
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
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            try {
                return Number(a) > Number(b);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class LessBlock extends BooleanBlock {
        constructor() {
            super("less");
            this.setPalette("boolean", activity);
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
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            try {
                return Number(a) < Number(b);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class EqualBlock extends BooleanBlock {
        constructor() {
            super("equal");
            this.setPalette("boolean", activity);
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
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            try {
                return a === b;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }

    class StaticBooleanBlock extends BooleanBlock {
        constructor() {
            super("boolean");
            this.setPalette("boolean", activity);
            this.setHelpString([
                _("The Boolean block is used to specify true or false."),
                "documentation",
                ""
            ]);
        }

        arg(logo, turtle, blk) {
            if (typeof activity.blocks.blockList[blk].value === "string") {
                return (
                    activity.blocks.blockList[blk].value === _("true") ||
                    activity.blocks.blockList[blk].value === "true"
                );
            }
            return activity.blocks.blockList[blk].value;
        }
    }

    new NotBlock().setup(activity);
    new XorBlock().setup(activity);
    new AndBlock().setup(activity);
    new OrBlock().setup(activity);
    new GreaterBlock().setup(activity);
    new LessBlock().setup(activity);
    new EqualBlock().setup(activity);
    new StaticBooleanBlock().setup(activity);
}
