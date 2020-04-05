function setupNumberBlocks() {
    class IntBlock extends LeftBlock {
        constructor() {
            super("int");
            this.setPalette("number");
            this.setHelpString([
                _("The Int block returns an integer."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("int"),
                args: 1,
                defaults: [100]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "int"]);
            } else {
                let cblk = logo.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (typeof a === "number") {
                        return Math.floor(a);
                    } else {
                        try {
                            return Math.floor(Number(a));
                        } catch (e) {
                            console.debug(e);
                            logo.errorMsg(NANERRORMSG, blk);
                            return 0;
                        }
                    }
                }
            }
        }
    }

    class ModBlock extends LeftBlock {
        constructor() {
            super("mod");
            this.setPalette("number");
            this.setHelpString([
                _("The Mod block returns the remainder from a division."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("mod"),
                args: 2,
                defaults: [100, 10]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "mod"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let cblk2 = logo.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    let a = logo.parseArg(
                        logo,
                        turtle,
                        cblk1,
                        blk,
                        receivedArg
                    );
                    let b = logo.parseArg(
                        logo,
                        turtle,
                        cblk2,
                        blk,
                        receivedArg
                    );
                    if (typeof a === "number" && typeof b === "number") {
                        return logo._doMod(a, b);
                    } else {
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
                }
            }
        }
    }

    class PowerBlock extends LeftBlock {
        constructor() {
            super("power");
            this.setPalette("number");
            this.setHelpString([
                _("The Power block calculates a power function."),
                "documentation",
                ""
            ]);

            this.fontsize = 14;
            this.formBlock({
                name: "^",
                args: 2,
                defaults: [2, 4]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "power"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let cblk2 = logo.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        let a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        return a;
                    } else {
                        return 0;
                    }
                } else {
                    let a = logo.parseArg(
                        logo,
                        turtle,
                        cblk1,
                        blk,
                        receivedArg
                    );
                    let b = logo.parseArg(
                        logo,
                        turtle,
                        cblk2,
                        blk,
                        receivedArg
                    );
                    if (typeof a === "number" && typeof b === "number") {
                        return logo._doPower(a, b);
                    } else {
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
                }
            }
        }
    }

    class SqrtBlock extends LeftBlock {
        constructor() {
            super("sqrt");
            this.setPalette("number");
            this.setHelpString([
                _("The Sqrt block returns the square root."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("sqrt"),
                args: 1,
                defaults: [64]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
            } else {
                let cblk = logo.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (typeof a === "number") {
                        if (a < 0) {
                            logo.errorMsg(NOSQRTERRORMSG, blk);
                            a = -a;
                        }

                        return logo._doSqrt(a);
                    } else {
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
                }
            }
        }
    }

    class AbsBlock extends LeftBlock {
        constructor() {
            super("abs");
            this.setPalette("number");
            this.setHelpString([
                _("The Abs block returns the absolute value."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("abs"),
                args: 1
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
            } else {
                let cblk = logo.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (typeof a === "number") {
                        return Math.abs(a);
                    } else {
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
                }
            }
        }
    }

    class DistanceBlock extends LeftBlock {
        constructor() {
            super("distance");
            this.setPalette("number");
            this.setHelpString([
                _(
                    "The Distance block returns the distance between two points. For example, between the mouse and the center of the screen."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("distance"),
                args: 4,
                defaults: [0, 0, 100, 100],
                argTypes: ["anyin", "anyin", "anyin", "anyin"],
                outType: "anyout",
                argLabels: ["x1", "y1", "x2", "y2"]
            });

            this.makeMacro((x, y) => [
                [0, "distance", x, y, [null, 1, 2, 3, 4]],
                [1, ["number", { value: 0 }], 0, 0, [0]],
                [2, ["number", { value: 0 }], 0, 0, [0]],
                [3, "x", 0, 0, [0]],
                [4, "y", 0, 0, [0]]
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "distance"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let cblk2 = logo.blocks.blockList[blk].connections[2];
                let cblk3 = logo.blocks.blockList[blk].connections[3];
                let cblk4 = logo.blocks.blockList[blk].connections[4];
                if (
                    cblk1 === null ||
                    cblk2 === null ||
                    cblk3 === null ||
                    cblk4 === null
                ) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    let x1 = logo.parseArg(
                        logo,
                        turtle,
                        cblk1,
                        blk,
                        receivedArg
                    );
                    let y1 = logo.parseArg(
                        logo,
                        turtle,
                        cblk2,
                        blk,
                        receivedArg
                    );
                    let x2 = logo.parseArg(
                        logo,
                        turtle,
                        cblk3,
                        blk,
                        receivedArg
                    );
                    let y2 = logo.parseArg(
                        logo,
                        turtle,
                        cblk4,
                        blk,
                        receivedArg
                    );
                    if (
                        typeof x1 === "number" &&
                        typeof y1 === "number" &&
                        typeof x2 === "number" &&
                        typeof y2 === "number"
                    ) {
                        return logo._docalculatedistance(x1, y1, x2, y2);
                    } else {
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
                }
            }
        }
    }

    class DivideBlock extends LeftBlock {
        constructor() {
            super("divide");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Divide block is used to divide."),
                "documentation",
                null,
                "note1"
            ]);

            this.fontsize = 9;
            this.formBlock({
                name: this.lang === "ja" ? "➗" : "/",
                args: 2,
                defaults: [1, 4]
            });
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "divide"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let cblk2 = logo.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        let a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        return a;
                    } else {
                        return 0;
                    }
                } else {
                    let a = logo.parseArg(
                        logo,
                        turtle,
                        cblk1,
                        blk,
                        receivedArg
                    );
                    let b = logo.parseArg(
                        logo,
                        turtle,
                        cblk2,
                        blk,
                        receivedArg
                    );
                    if (typeof a === "number" && typeof b === "number") {
                        return logo._doDivide(a, b);
                    } else {
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
                }
            }
        }
    }

    class MultiplyBlock extends LeftBlock {
        constructor() {
            super("multiply");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Multiply block is used to multiply."),
                "documentation",
                ""
            ]);

            this.fontsize = 14;
            this.formBlock({
                name: "×",
                args: 2,
                argTypes: ["anyin", "anyin"],
                defaults: [1, 12]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "multiply"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let cblk2 = logo.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        let a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        return a;
                    } else if (cblk2 !== null) {
                        let b = logo.parseArg(
                            logo,
                            turtle,
                            cblk2,
                            blk,
                            receivedArg
                        );
                        return b;
                    } else {
                        return 0;
                    }
                } else {
                    // We have a special case for certain keywords
                    // associated with octaves: current, next, and
                    // previous.

                    let cblk0 = logo.blocks.blockList[blk].connections[0];
                    let a,b;
                    if (
                        cblk0 !== null &&
                        logo.blocks.blockList[cblk0].name === "pitch"
                    ) {
                        let noteBlock =
                            logo.blocks.blockList[cblk0].connections[1];
                        if (
                            typeof logo.blocks.blockList[cblk1].value ===
                            "string"
                        ) {
                            a = calcOctave(
                                logo.currentOctave[turtle],
                                logo.blocks.blockList[cblk1].value,
                                logo.lastNotePlayed[turtle],
                                logo.blocks.blockList[noteBlock].value
                            );
                        } else {
                            a = logo.parseArg(
                                logo,
                                turtle,
                                cblk1,
                                blk,
                                receivedArg
                            );
                        }

                        if (
                            typeof logo.blocks.blockList[cblk2].value ===
                            "string"
                        ) {
                            b = calcOctave(
                                logo.currentOctave[turtle],
                                logo.blocks.blockList[cblk2].value,
                                logo.lastNotePlayed[turtle],
                                logo.blocks.blockList[noteBlock].value
                            );
                        } else {
                            b = logo.parseArg(
                                logo,
                                turtle,
                                cblk2,
                                blk,
                                receivedArg
                            );
                        }
                    } else {
                        a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        b = logo.parseArg(
                            logo,
                            turtle,
                            cblk2,
                            blk,
                            receivedArg
                        );
                    }

                    return logo._doMultiply(a, b);
                }
            }
        }
    }

    class NegBlock extends LeftBlock {
        constructor() {
            super("neg");
            this.setPalette("number");
            this.setHelpString();

            this.fontsize = 14;
            this.formBlock({
                name: "–",
                args: 1,
                argTypes: ["anyin"],
                outType: "numberout"
            });
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "neg"]);
            } else {
                let cblk = logo.blocks.blockList[blk].connections[1];
                if (cblk !== null) {
                    let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (typeof a === "number") {
                        return logo._doMinus(0, a);
                    } else if (typeof a === "string") {
                        let obj = a.split("");
                        return obj.reverse().join("");
                    } else {
                        return a;
                    }
                } else {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                }
            }
        }
    }

    class MinusBlock extends LeftBlock {
        constructor() {
            super("minus");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Minus block is used to subtract."),
                "documentation",
                ""
            ]);

            this.fontsize = 14;
            this.formBlock({
                name: "–",
                args: 2,
                defaults: [8, 4],
                argTypes: ["anyin", "anyin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "minus"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let cblk2 = logo.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        let a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        return a;
                    } else if (cblk2 !== null) {
                        let b = logo.parseArg(
                            logo,
                            turtle,
                            cblk2,
                            blk,
                            receivedArg
                        );
                        return -b;
                    } else {
                        return 0;
                    }
                } else {
                    // We have a special case for certain keywords
                    // associated with octaves: current, next, and
                    // previous.

                    let cblk0 = logo.blocks.blockList[blk].connections[0];
                    let a,b;
                    if (
                        cblk0 !== null &&
                        logo.blocks.blockList[cblk0].name === "pitch"
                    ) {
                        let noteBlock =
                            logo.blocks.blockList[cblk0].connections[1];
                        if (
                            typeof logo.blocks.blockList[cblk1].value === "string"
                        ) {
                            a = calcOctave(
                                logo.currentOctave[turtle],
                                logo.blocks.blockList[cblk1].value,
                                logo.lastNotePlayed[turtle],
                                logo.blocks.blockList[noteBlock].value
                            );
                        } else {
                            a = logo.parseArg(
                                logo,
                                turtle,
                                cblk1,
                                blk,
                                receivedArg
                            );
                        }

                        if (
                            typeof logo.blocks.blockList[cblk2].value ===
                            "string"
                        ) {
                            b = calcOctave(
                                logo.currentOctave[turtle],
                                logo.blocks.blockList[cblk2].value,
                                logo.lastNotePlayed[turtle],
                                logo.blocks.blockList[noteBlock].value
                            );
                        } else {
                            b = logo.parseArg(
                                logo,
                                turtle,
                                cblk2,
                                blk,
                                receivedArg
                            );
                        }
                    } else {
                        a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        b = logo.parseArg(
                            logo,
                            turtle,
                            cblk2,
                            blk,
                            receivedArg
                        );
                    }

                    return logo._doMinus(a, b);
                }
            }
        }
    }

    class PlusBlock extends LeftBlock {
        constructor() {
            super("plus");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Plus block is used to add."),
                "documentation",
                ""
            ]);

            this.fontsize = 14;
            this.formBlock({
                name: "+",
                outType: "anyout",
                args: 2,
                defaults: [2, 2],
                argTypes: ["anyin", "anyin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (typeof logo.blocks.blockList[blk].value === "string") {
                return logo.blocks.blockList[blk].value;
            } else {
                return toFixed2(logo.blocks.blockList[blk].value);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "plus"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let cblk2 = logo.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        let a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        return a;
                    } else if (cblk2 !== null) {
                        let b = logo.parseArg(
                            logo,
                            turtle,
                            cblk2,
                            blk,
                            receivedArg
                        );
                        return b;
                    } else {
                        return 0;
                    }
                } else {
                    // We have a special case for certain keywords
                    // associated with octaves: current, next, and
                    // previous. In the case of plus, since we use it
                    // for string concatenation as well, we check to
                    // see if the block is connected to a pitch block
                    // before assuming octave.

                    let cblk0 = logo.blocks.blockList[blk].connections[0];
                    let a,b;
                    if (
                        cblk0 !== null &&
                        logo.blocks.blockList[cblk0].name === "pitch"
                    ) {
                        let noteBlock =
                            logo.blocks.blockList[cblk0].connections[1];
                        if (
                            typeof logo.blocks.blockList[cblk1].value ===
                            "string"
                        ) {
                            a = calcOctave(
                                logo.currentOctave[turtle],
                                logo.blocks.blockList[cblk1].value,
                                logo.lastNotePlayed[turtle],
                                logo.blocks.blockList[noteBlock].value
                            );
                        } else {
                            a = logo.parseArg(
                                logo,
                                turtle,
                                cblk1,
                                blk,
                                receivedArg
                            );
                        }

                        if (
                            typeof logo.blocks.blockList[cblk2].value ===
                            "string"
                        ) {
                            b = calcOctave(
                                logo.currentOctave[turtle],
                                logo.blocks.blockList[cblk2].value,
                                logo.lastNotePlayed[turtle],
                                logo.blocks.blockList[noteBlock].value
                            );
                        } else {
                            b = logo.parseArg(
                                logo,
                                turtle,
                                cblk2,
                                blk,
                                receivedArg
                            );
                        }
                    } else {
                        a = logo.parseArg(
                            logo,
                            turtle,
                            cblk1,
                            blk,
                            receivedArg
                        );
                        b = logo.parseArg(
                            logo,
                            turtle,
                            cblk2,
                            blk,
                            receivedArg
                        );
                    }

                    return logo._doPlus(a, b);
                }
            }
        }
    }

    class OneOfBlock extends LeftBlock {
        constructor() {
            super("oneOf");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The One-of block returns one of two choices."),
                "documentation",
                null,
                "oneofhelp"
            ]);

            this.formBlock({
                name: _("one of"),
                args: 2,
                argLabels: [_("this"), _("that")],
                outType: "anyout",
                argTypes: ["anyin", "anyin"],
                defaults: [-90, 90]
            });

            this.makeMacro((x, y) => [
                [0, "oneOf", x, y, [null, 1, 2, null]],
                [1, ["solfege", { value: "do" }], 0, 0, [0]],
                [2, ["solfege", { value: "sol" }], 0, 0, [0]]
            ]);
        }

        updateParameter(logo, turtle, blk) {
            if (typeof logo.blocks.blockList[blk].value === "string") {
                return logo.blocks.blockList[blk].value;
            } else {
                return toFixed2(logo.blocks.blockList[blk].value);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            let cblk2 = logo.blocks.blockList[blk].connections[2];
            let a,b;
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    a = logo.parseArg(
                        logo,
                        turtle,
                        cblk1,
                        blk,
                        receivedArg
                    );
                    return a;
                } else if (cblk2 !== null) {
                    b = logo.parseArg(
                        logo,
                        turtle,
                        cblk2,
                        blk,
                        receivedArg
                    );
                    return b;
                } else {
                    return 0;
                }
            } else {
                a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                return logo._doOneOf(a, b);
            }
        }
    }

    class RandomBlock extends LeftBlock {
        constructor() {
            super("random");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Random block returns a random number."),
                "documentation",
                null,
                "randomhelp"
            ]);

            this.formBlock({
                name: _("random"),
                args: 2,
                argLabels: [_("min"), _("max")],
                argTypes: ["anyin", "anyin"],
                defaults: [0, 12]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (typeof logo.blocks.blockList[blk].value === "string") {
                return logo.blocks.blockList[blk].value;
            } else {
                return toFixed2(logo.blocks.blockList[blk].value);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            let cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            let b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            if (typeof a === "number" && typeof b === "number") {
                return logo._doRandom(a, b);
            } else if (
                typeof a === "string" &&
                typeof b === "string" &&
                SOLFEGENAMES.indexOf(a) != -1 &&
                SOLFEGENAMES.indexOf(b) != -1
            ) {
                let ai = SOLFEGENAMES.indexOf(a);
                let bi = SOLFEGENAMES.indexOf(b);
                if (ai > bi) {
                    ai = SOLFEGENAMES.indexOf(b);
                    bi = SOLFEGENAMES.indexOf(a);
                }

                let ii = logo._doRandom(ai, bi);
                return SOLFEGENAMES[ii];
            }
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }
    }

    class NumberBlock extends ValueBlock {
        constructor() {
            super("number");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Number block holds a number."),
                "documentation",
                ""
            ]);
        }

        arg(logo, turtle, blk) {
            try {
                return Number(logo.blocks.blockList[blk].value);
            } catch (e) {
                console.debug(e);
                return 0;
            }
        }
    }

    new DistanceBlock().setup();
    new IntBlock().setup();
    new ModBlock().setup();
    new PowerBlock().setup();
    new SqrtBlock().setup();
    new AbsBlock().setup();
    new DivideBlock().setup();
    new MultiplyBlock().setup();
    new NegBlock().setup();
    new MinusBlock().setup();
    new PlusBlock().setup();
    new OneOfBlock().setup();
    new RandomBlock().setup();
    new NumberBlock().setup();
}
