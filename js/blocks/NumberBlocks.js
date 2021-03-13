function setupNumberBlocks() {
    class IntBlock extends LeftBlock {
        constructor() {
            super("int");
            this.setPalette("number");
            this.setHelpString([_("The Int block returns an integer."), "documentation", ""]);

            this.formBlock({
                name: _("int"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [100]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "int"]);
            } else {
                const cblk = logo.blocks.blockList[blk].connections[1];

                if (cblk === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

                    try {
                        return MathUtility.doInt(a);
                    } catch (e) {
                        this.stopTurtle = true;
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
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
                defaults: [100, 12]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(logo.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "mod"]);
            } else {
                const cblk1 = logo.blocks.blockList[blk].connections[1];
                const cblk2 = logo.blocks.blockList[blk].connections[2];

                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

                    try {
                        return MathUtility.doMod(a, b);
                    } catch (e) {
                        logo.stopTurtle = true;
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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "power"]);
            } else {
                const cblk1 = logo.blocks.blockList[blk].connections[1];
                const cblk2 = logo.blocks.blockList[blk].connections[2];

                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    } else {
                        return 0;
                    }
                } else {
                    const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

                    try {
                        return MathUtility.doPower(a, b);
                    } catch (e) {
                        logo.stopTurtle = true;
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
            this.setHelpString([_("The Sqrt block returns the square root."), "documentation", ""]);

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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
            } else {
                const cblk = logo.blocks.blockList[blk].connections[1];

                if (cblk === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    try {
                        return MathUtility.doSqrt(a);
                    } catch (e) {
                        logo.stopTurtle = true;
                        if (e === "NanError") {
                            logo.errorMsg(NANERRORMSG, blk);
                        } else if (e === "NoSqrtError") {
                            logo.errorMsg(NOSQRTERRORMSG, blk);
                            return MathUtility.doSqrt(-a);
                        }
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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
            } else {
                const cblk = logo.blocks.blockList[blk].connections[1];

                if (cblk === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

                    try {
                        return MathUtility.doAbs(a);
                    } catch (e) {
                        this.stopTurtle = true;
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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "distance"]);
            } else {
                const cblk1 = logo.blocks.blockList[blk].connections[1];
                const cblk2 = logo.blocks.blockList[blk].connections[2];
                const cblk3 = logo.blocks.blockList[blk].connections[3];
                const cblk4 = logo.blocks.blockList[blk].connections[4];

                if (cblk1 === null || cblk2 === null || cblk3 === null || cblk4 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    return 0;
                } else {
                    const x1 = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    const y1 = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    const x2 = logo.parseArg(logo, turtle, cblk3, blk, receivedArg);
                    const y2 = logo.parseArg(logo, turtle, cblk4, blk, receivedArg);

                    try {
                        return MathUtility.doCalculateDistance(x1, y1, x2, y2);
                    } catch (e) {
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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "divide"]);
            } else {
                const cblk1 = logo.blocks.blockList[blk].connections[1];
                const cblk2 = logo.blocks.blockList[blk].connections[2];

                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    } else {
                        return 0;
                    }
                } else {
                    const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

                    try {
                        return MathUtility.doDivide(a, b);
                    } catch (e) {
                        logo.stopTurtle = true;
                        if (e === "NanError") {
                            logo.errorMsg(NANERRORMSG, blk);
                        } else if (e === "DivByZeroError") {
                            logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                        }
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

            this.setHelpString([_("The Multiply block is used to multiply."), "documentation", ""]);

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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "multiply"]);
            } else {
                const cblk1 = logo.blocks.blockList[blk].connections[1];
                const cblk2 = logo.blocks.blockList[blk].connections[2];

                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    } else if (cblk2 !== null) {
                        return logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    } else {
                        return 0;
                    }
                } else {
                    const tur = logo.turtles.ithTurtle(turtle);

                    // We have a special case for certain keywords associated with octaves:
                    // current, next, and previous.

                    const cblk0 = logo.blocks.blockList[blk].connections[0];

                    let a, b;
                    if (cblk0 !== null && logo.blocks.blockList[cblk0].name === "pitch") {
                        const noteBlock = logo.blocks.blockList[cblk0].connections[1];

                        a =
                            typeof logo.blocks.blockList[cblk1].value === "string"
                                ? calcOctave(
                                      tur.singer.currentOctave,
                                      logo.blocks.blockList[cblk1].value,
                                      tur.singer.lastNotePlayed,
                                      logo.blocks.blockList[noteBlock].value
                                  )
                                : logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

                        b =
                            typeof logo.blocks.blockList[cblk2].value === "string"
                                ? calcOctave(
                                      tur.singer.currentOctave,
                                      logo.blocks.blockList[cblk2].value,
                                      tur.singer.lastNotePlayed,
                                      logo.blocks.blockList[noteBlock].value
                                  )
                                : logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    } else {
                        a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                        b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    }

                    try {
                        return MathUtility.doMultiply(a, b);
                    } catch (e) {
                        logo.stopTurtle = true;
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "neg"]);
            } else {
                const cblk = logo.blocks.blockList[blk].connections[1];

                if (cblk !== null) {
                    const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

                    try {
                        return MathUtility.doNegate(a);
                    } catch {
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

            this.setHelpString([_("The Minus block is used to subtract."), "documentation", ""]);

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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "minus"]);
            } else {
                const cblk1 = logo.blocks.blockList[blk].connections[1];
                const cblk2 = logo.blocks.blockList[blk].connections[2];

                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    } else if (cblk2 !== null) {
                        return -1 * logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    } else {
                        return 0;
                    }
                } else {
                    const tur = logo.turtles.ithTurtle(turtle);

                    // We have a special case for certain keywords associated with octaves:
                    // current, next, and previous.

                    const cblk0 = logo.blocks.blockList[blk].connections[0];

                    let a, b;
                    if (cblk0 !== null && logo.blocks.blockList[cblk0].name === "pitch") {
                        const noteBlock = logo.blocks.blockList[cblk0].connections[1];

                        a =
                            typeof logo.blocks.blockList[cblk1].value === "string"
                                ? calcOctave(
                                      tur.singer.currentOctave,
                                      logo.blocks.blockList[cblk1].value,
                                      tur.singer.lastNotePlayed,
                                      logo.blocks.blockList[noteBlock].value
                                  )
                                : logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

                        b =
                            typeof logo.blocks.blockList[cblk2].value === "string"
                                ? calcOctave(
                                      tur.singer.currentOctave,
                                      logo.blocks.blockList[cblk2].value,
                                      tur.singer.lastNotePlayed,
                                      logo.blocks.blockList[noteBlock].value
                                  )
                                : logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    } else {
                        a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                        b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    }

                    try {
                        return MathUtility.doMinus(a, b);
                    } catch (e) {
                        logo.stopTurtle = true;
                        logo.errorMsg(NANERRORMSG, blk);
                        return 0;
                    }
                }
            }
        }
    }

    class PlusBlock extends LeftBlock {
        constructor() {
            super("plus");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([_("The Plus block is used to add."), "documentation", ""]);

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
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "plus"]);
            } else {
                const cblk1 = logo.blocks.blockList[blk].connections[1];
                const cblk2 = logo.blocks.blockList[blk].connections[2];

                if (cblk1 === null || cblk2 === null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    } else if (cblk2 !== null) {
                        return logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    } else {
                        return 0;
                    }
                } else {
                    const tur = logo.turtles.ithTurtle(turtle);

                    // We have a special case for certain keywords associated with octaves:
                    // current, next, and previous. In the case of plus, since we use it
                    // for string concatenation as well, we check to see if the block is
                    // connected to a pitch block before assuming octave.

                    const cblk0 = logo.blocks.blockList[blk].connections[0];

                    let a, b;
                    if (cblk0 !== null && logo.blocks.blockList[cblk0].name === "pitch") {
                        if (logo.blocks.blockList[cblk2].name === "accidentalname") {
                            let scaledegree;
                            if (logo.blocks.blockList[cblk1].name === "namedbox") {
                                scaledegree = logo.boxes[logo.blocks.blockList[cblk1].overrideName];
                            } else {
                                scaledegree = logo.blocks.blockList[cblk1].value;
                            }

                            let attr = logo.blocks.blockList[cblk2].value.split(" ");
                            attr = attr[attr.length - 1];
                            scaledegree += attr;

                            return scaledegree;
                        } else {
                            const noteBlock = logo.blocks.blockList[cblk0].connections[1];

                            a =
                                typeof logo.blocks.blockList[cblk1].value === "string"
                                    ? calcOctave(
                                          tur.singer.currentOctave,
                                          logo.blocks.blockList[cblk1].value,
                                          tur.singer.lastNotePlayed,
                                          logo.blocks.blockList[noteBlock].value
                                      )
                                    : logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

                            b =
                                typeof logo.blocks.blockList[cblk2].value === "string"
                                    ? calcOctave(
                                          tur.singer.currentOctave,
                                          logo.blocks.blockList[cblk2].value,
                                          tur.singer.lastNotePlayed,
                                          logo.blocks.blockList[noteBlock].value
                                      )
                                    : logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                        }
                    } else {
                        a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                        b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    }

                    return MathUtility.doPlus(a, b);
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
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];

            let a, b;
            if (cblk1 !== null) {
                a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            }
            if (cblk2 !== null) {
                b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            }

            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    return a;
                } else if (cblk2 !== null) {
                    return b;
                } else {
                    return 0;
                }
            } else {
                return MathUtility.doOneOf(a, b);
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
            const cblk0 = logo.blocks.blockList[blk].connections[0];
            const cblk1 = logo.blocks.blockList[blk].connections[1];
            const cblk2 = logo.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            let octave = undefined;

            // Check if connected to pitch block and read octave values
            if (cblk0 !== null) {
                let par = logo.blocks.blockList[cblk0];
                while (par.name === "hspace") {
                    par = logo.blocks.blockList[par.connections[0]];
                }
                if (par.name === "pitch") {
                    octave = logo.blocks.blockList[par.connections[2]].value;
                }
            }

            try {
                if (octave === undefined) {
                    const randomResult = MathUtility.doRandom(a, b, octave);
                    if (typeof randomResult === "object") {
                        return randomResult[0];
                    }
                    return randomResult;
                } else {
                    return MathUtility.doRandom(a, b, octave);
                }
            } catch (e) {
                logo.stopTurtle = true;
                logo.errorMsg(NANERRORMSG, blk);
                return 0;
            }
        }
    }

    class NumberBlock extends ValueBlock {
        constructor() {
            super("number");
            this.setPalette("number");
            this.beginnerBlock(true);

            this.setHelpString([_("The Number block holds a number."), "documentation", ""]);
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
