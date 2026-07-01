// Copyright (c) 2014-2021 Walter Bender
// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2020 Anindya Kundu
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

   NOTEDIV, define
 */

/*
   exported

   EmbeddedGraphicsScheduler
 */

/**
 * @class
 * @classdesc Schedules embedded graphics commands during note playback.
 * Extracted from Logo.dispatchTurtleSignals to own all animation-scheduling
 * responsibilities for turtle graphics that occur inside note blocks.
 */
class EmbeddedGraphicsScheduler {
    /**
     * @constructor
     * @param {Object} logo - The Logo instance this scheduler operates on behalf of.
     *   Required members: turtles, blockList, parseArg, processShow, processSpeak,
     *   receivedArg, stopTurtle, svgBackground, _timerManager, deps.utils.delayExecution,
     *   deps.textMsg.
     */
    constructor(logo) {
        this._logo = logo;
    }

    /**
     * Schedules turtle graphics commands to execute progressively over the
     * duration of a note, matching the timing of the note playback.
     *
     * @param {number} turtle - Turtle index.
     * @param {number} beatValue - Duration of the note in beats (seconds).
     * @param {number} blk - Block index of the note block.
     * @param {number} delay - Initial delay before the first graphic fires (seconds).
     */
    async schedule(turtle, beatValue, blk, delay) {
        const logo = this._logo;
        const tur = logo.turtles.ithTurtle(turtle);

        if (Object.keys(tur.singer.embeddedGraphics).length === 0) return;

        if (!(blk in tur.singer.embeddedGraphics)) return;

        if (tur.singer.embeddedGraphics[blk].length === 0) return;

        // If the previous note's graphics are not complete, add a
        // slight delay before drawing any new graphics.
        if (!tur.embeddedGraphicsFinished) {
            delay += 0.1;
        }

        tur.embeddedGraphicsFinished = false;

        const suppressOutput = tur.singer.suppressOutput;

        const fillState = { inFillClamp: false };
        const hollowState = { inHollowLineClamp: false };

        const embeddedGraphicsLength = tur.singer.embeddedGraphics[blk].length;
        let extendedGraphicsCounter = 0;
        for (let i = 0; i < embeddedGraphicsLength; i++) {
            const b = tur.singer.embeddedGraphics[blk][i];
            switch (logo.blockList[b].name) {
                case "forward":
                case "back":
                case "right":
                case "left":
                case "arc":
                    ++extendedGraphicsCounter;
                    break;
                default:
                    break;
            }
        }

        // Cheat by 0.5% so that the mouse has time to complete its work.
        let stepTime = ((beatValue - delay) * 995) / NOTEDIV;
        if (stepTime < 0) stepTime = 0;

        // We do each graphics action sequentially, so we need to
        // divide stepTime by the length of the embedded graphics
        // array.
        if (extendedGraphicsCounter > 0) {
            stepTime = stepTime / extendedGraphicsCounter;
        }

        let waitTime = delay * 1000;

        // Update the turtle graphics every 50ms within a note.
        if (stepTime > 200) {
            tur.singer.dispatchFactor = NOTEDIV / 32;
        } else if (stepTime > 100) {
            tur.singer.dispatchFactor = NOTEDIV / 16;
        } else if (stepTime > 50) {
            tur.singer.dispatchFactor = NOTEDIV / 8;
        } else if (stepTime > 25) {
            tur.singer.dispatchFactor = NOTEDIV / 4;
        } else if (stepTime > 12.5) {
            tur.singer.dispatchFactor = NOTEDIV / 2;
        } else {
            tur.singer.dispatchFactor = NOTEDIV;
        }

        for (let i = 0; i < embeddedGraphicsLength; i++) {
            const b = tur.singer.embeddedGraphics[blk][i];
            const name = logo.blockList[b].name;

            switch (name) {
                case "setcolor":
                case "sethue":
                case "setshade":
                case "settranslucency":
                case "setgrey":
                case "setpensize":
                    this._pen(tur, suppressOutput, turtle, name, b, waitTime);
                    break;

                case "penup":
                case "pendown":
                    if (!suppressOutput) {
                        this._pen(tur, suppressOutput, turtle, name, null, waitTime);
                    }
                    break;

                case "clear":
                    this._clear(tur, suppressOutput);
                    break;

                case "fill":
                    this._fill(tur, suppressOutput, fillState, waitTime);
                    break;

                case "hollowline":
                    this._hollowline(tur, suppressOutput, hollowState, waitTime);
                    break;

                case "controlpoint1":
                    this._cp1(tur, suppressOutput, turtle, b, waitTime);
                    break;

                case "controlpoint2":
                    this._cp2(tur, suppressOutput, turtle, b, waitTime);
                    break;

                case "bezier":
                    /**
                     * @todo Is there a reasonable way to break the bezier
                     * curve up into small steps?
                     */
                    this._bezier(tur, suppressOutput, turtle, b, waitTime);
                    break;

                case "setheading":
                    this._setheading(tur, suppressOutput, turtle, b, waitTime);
                    break;

                case "right":
                    this._right(tur, suppressOutput, turtle, b, waitTime, stepTime, 1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "left":
                    this._right(tur, suppressOutput, turtle, b, waitTime, stepTime, -1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "forward":
                    this._forward(tur, suppressOutput, turtle, b, waitTime, stepTime, 1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "back":
                    this._forward(tur, suppressOutput, turtle, b, waitTime, stepTime, -1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "setxy":
                    this._setxy(tur, suppressOutput, turtle, b, waitTime);
                    break;

                case "scrollxy":
                    this._scrollxy(tur, suppressOutput, turtle, b, waitTime);
                    break;

                case "show":
                    this._show(suppressOutput, turtle, b, waitTime);
                    break;

                case "speak":
                    this._speak(suppressOutput, turtle, b, waitTime);
                    break;

                case "print":
                    this._print(suppressOutput, turtle, b, waitTime);
                    break;

                case "arc":
                    this._arc(tur, suppressOutput, turtle, b, waitTime, stepTime);
                    waitTime += NOTEDIV * stepTime;
                    break;

                default:
                    break;
            }
        }

        // Mark the end time of this note's graphics operations.
        await logo.deps.utils.delayExecution(beatValue * 1000);
        tur.embeddedGraphicsFinished = true;
    }

    _pen(tur, suppressOutput, turtle, name, b, timeout) {
        const logo = this._logo;
        let arg;
        switch (name) {
            case "penup":
            case "pendown":
                break;
            default:
                arg = logo.parseArg(
                    logo,
                    turtle,
                    logo.blockList[b].connections[1],
                    b,
                    logo.receivedArg
                );
                break;
        }
        const _penSwitch = name => {
            switch (name) {
                case "penup":
                    tur.painter.doPenUp();
                    break;
                case "pendown":
                    tur.painter.doPenDown();
                    break;
                case "setcolor":
                    tur.painter.doSetColor(arg);
                    break;
                case "sethue":
                    tur.painter.doSetHue(arg);
                    break;
                case "setshade":
                    tur.painter.doSetValue(arg);
                    break;
                case "settranslucency":
                    tur.painter.doSetPenAlpha(arg);
                    break;
                case "setgrey":
                    tur.painter.doSetChroma(arg);
                    break;
                case "setpensize":
                    tur.painter.doSetPensize(arg);
                    break;
            }
        };

        if (suppressOutput) {
            _penSwitch(name);
        } else {
            logo._timerManager.setGuardedTimeout(
                () => _penSwitch(name),
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _clear(tur, suppressOutput) {
        const logo = this._logo;
        if (suppressOutput) {
            const savedPenState = tur.painter.penState;
            tur.painter.penState = false;
            tur.painter.doSetXY(0, 0);
            tur.painter.doSetHeading(0);
            tur.painter.penState = savedPenState;
            logo.svgBackground = true;
        } else {
            tur.painter.penState = false;
            tur.painter.doSetHeading(0);
            tur.painter.doSetXY(0, 0);
            tur.painter.penState = true;
            // tur.painter.doClear(true, true, true);
        }
    }

    _right(tur, suppressOutput, turtle, b, waitTime, stepTime, sign) {
        const logo = this._logo;
        const arg =
            logo.parseArg(logo, turtle, logo.blockList[b].connections[1], b, logo.receivedArg) *
            sign;
        if (suppressOutput) {
            const savedPenState = tur.painter.penState;
            tur.painter.penState = false;
            tur.painter.doRight(arg);
            tur.painter.penState = savedPenState;
        } else {
            for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                logo._timerManager.setGuardedTimeout(
                    () => tur.painter.doRight(deltaArg),
                    deltaTime,
                    () => logo.stopTurtle
                );
            }
        }
    }

    _setheading(tur, suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) {
            const arg = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[1],
                b,
                logo.receivedArg
            );
            tur.painter.doSetHeading(arg);
        } else {
            logo._timerManager.setGuardedTimeout(
                () => {
                    const arg = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[1],
                        b,
                        logo.receivedArg
                    );
                    tur.painter.doSetHeading(arg);
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _forward(tur, suppressOutput, turtle, b, waitTime, stepTime, sign) {
        const logo = this._logo;
        const arg =
            logo.parseArg(logo, turtle, logo.blockList[b].connections[1], b, logo.receivedArg) *
            sign;
        if (suppressOutput) {
            const savedPenState = tur.painter.penState;
            tur.painter.penState = false;
            tur.painter.doForward(arg);
            tur.painter.penState = savedPenState;
        } else {
            for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                if (t === 0) {
                    logo._timerManager.setGuardedTimeout(
                        () => tur.painter.doForward(deltaArg, "first"),
                        deltaTime,
                        () => logo.stopTurtle
                    );
                } else if (t === Math.ceil(NOTEDIV / tur.singer.dispatchFactor) - 1) {
                    logo._timerManager.setGuardedTimeout(
                        () => tur.painter.doForward(deltaArg, "last"),
                        deltaTime,
                        () => logo.stopTurtle
                    );
                } else {
                    logo._timerManager.setGuardedTimeout(
                        () => tur.painter.doForward(deltaArg, "middle"),
                        deltaTime,
                        () => logo.stopTurtle
                    );
                }
            }
        }
    }

    _scrollxy(tur, suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) {
            const arg1 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[1],
                b,
                logo.receivedArg
            );
            const arg2 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[2],
                b,
                logo.receivedArg
            );
            tur.painter.doScrollXY(arg1, arg2);
        } else {
            logo._timerManager.setGuardedTimeout(
                () => {
                    const arg1 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[1],
                        b,
                        logo.receivedArg
                    );
                    const arg2 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[2],
                        b,
                        logo.receivedArg
                    );
                    tur.painter.doScrollXY(arg1, arg2);
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _setxy(tur, suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) {
            const savedPenState = tur.painter.penState;
            const arg1 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[1],
                b,
                logo.receivedArg
            );
            const arg2 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[2],
                b,
                logo.receivedArg
            );
            tur.painter.penState = false;
            tur.painter.doSetXY(arg1, arg2);
            tur.painter.penState = savedPenState;
        } else {
            logo._timerManager.setGuardedTimeout(
                () => {
                    const arg1 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[1],
                        b,
                        logo.receivedArg
                    );
                    const arg2 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[2],
                        b,
                        logo.receivedArg
                    );
                    tur.painter.doSetXY(arg1, arg2);
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _show(suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) return;
        const arg1 = logo.parseArg(
            logo,
            turtle,
            logo.blockList[b].connections[1],
            b,
            logo.receivedArg
        );
        const arg2 = logo.parseArg(
            logo,
            turtle,
            logo.blockList[b].connections[2],
            b,
            logo.receivedArg
        );
        logo._timerManager.setGuardedTimeout(
            () => logo.processShow(turtle, null, arg1, arg2),
            timeout,
            () => logo.stopTurtle
        );
    }

    _speak(suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) return;
        const arg = logo.parseArg(
            logo,
            turtle,
            logo.blockList[b].connections[1],
            b,
            logo.receivedArg
        );
        logo._timerManager.setGuardedTimeout(
            () => logo.processSpeak(arg),
            timeout,
            () => logo.stopTurtle
        );
    }

    _print(suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) return;
        const arg = logo.parseArg(
            logo,
            turtle,
            logo.blockList[b].connections[1],
            b,
            logo.receivedArg
        );
        if (arg === undefined) return;
        logo._timerManager.setGuardedTimeout(
            () => logo.deps.textMsg(arg.toString()),
            timeout,
            () => logo.stopTurtle
        );
    }

    _arc(tur, suppressOutput, turtle, b, waitTime, stepTime) {
        const logo = this._logo;
        const arg1 = logo.parseArg(
            logo,
            turtle,
            logo.blockList[b].connections[1],
            b,
            logo.receivedArg
        );
        const arg2 = logo.parseArg(
            logo,
            turtle,
            logo.blockList[b].connections[2],
            b,
            logo.receivedArg
        );
        if (suppressOutput) {
            const savedPenState = tur.painter.penState;
            tur.painter.penState = false;
            tur.painter.doArc(arg1, arg2);
            tur.painter.penState = savedPenState;
        } else {
            for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                const deltaArg = arg1 / (NOTEDIV / tur.singer.dispatchFactor);
                logo._timerManager.setGuardedTimeout(
                    () => tur.painter.doArc(deltaArg, arg2),
                    deltaTime,
                    () => logo.stopTurtle
                );
            }
        }
    }

    _cp1(tur, suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) {
            const arg1 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[1],
                b,
                logo.receivedArg
            );
            const arg2 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[2],
                b,
                logo.receivedArg
            );
            tur.painter.cp1x = arg1;
            tur.painter.cp1y = arg2;
        } else {
            logo._timerManager.setGuardedTimeout(
                () => {
                    const arg1 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[1],
                        b,
                        logo.receivedArg
                    );
                    const arg2 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[2],
                        b,
                        logo.receivedArg
                    );
                    tur.painter.cp1x = arg1;
                    tur.painter.cp1y = arg2;
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _cp2(tur, suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) {
            const arg1 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[1],
                b,
                logo.receivedArg
            );
            const arg2 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[2],
                b,
                logo.receivedArg
            );
            tur.painter.cp2x = arg1;
            tur.painter.cp2y = arg2;
        } else {
            logo._timerManager.setGuardedTimeout(
                () => {
                    const arg1 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[1],
                        b,
                        logo.receivedArg
                    );
                    const arg2 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[2],
                        b,
                        logo.receivedArg
                    );
                    tur.painter.cp2x = arg1;
                    tur.painter.cp2y = arg2;
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _bezier(tur, suppressOutput, turtle, b, timeout) {
        const logo = this._logo;
        if (suppressOutput) {
            const savedPenState = tur.painter.penState;
            const arg1 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[1],
                b,
                logo.receivedArg
            );
            const arg2 = logo.parseArg(
                logo,
                turtle,
                logo.blockList[b].connections[2],
                b,
                logo.receivedArg
            );
            tur.painter.penState = false;
            tur.painter.doBezier(arg1, arg2);
            tur.painter.penState = savedPenState;
        } else {
            logo._timerManager.setGuardedTimeout(
                () => {
                    const arg1 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[1],
                        b,
                        logo.receivedArg
                    );
                    const arg2 = logo.parseArg(
                        logo,
                        turtle,
                        logo.blockList[b].connections[2],
                        b,
                        logo.receivedArg
                    );
                    tur.painter.doBezier(arg1, arg2);
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _fill(tur, suppressOutput, fillState, timeout) {
        if (suppressOutput) {
            const savedPenState = tur.painter.penState;
            tur.painter.penState = false;
            if (fillState.inFillClamp) {
                tur.painter.doEndFill();
                fillState.inFillClamp = false;
            } else {
                tur.painter.doStartFill();
                fillState.inFillClamp = true;
            }
            tur.painter.penState = savedPenState;
        } else {
            const logo = this._logo;
            logo._timerManager.setGuardedTimeout(
                () => {
                    if (fillState.inFillClamp) {
                        tur.painter.doEndFill();
                        fillState.inFillClamp = false;
                    } else {
                        tur.painter.doStartFill();
                        fillState.inFillClamp = true;
                    }
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }

    _hollowline(tur, suppressOutput, hollowState, timeout) {
        if (suppressOutput) {
            if (hollowState.inHollowLineClamp) {
                tur.painter.doEndHollowLine();
                hollowState.inHollowLineClamp = false;
            } else {
                tur.painter.doStartHollowLine();
                hollowState.inHollowLineClamp = true;
            }
        } else {
            const logo = this._logo;
            logo._timerManager.setGuardedTimeout(
                () => {
                    if (hollowState.inHollowLineClamp) {
                        tur.painter.doEndHollowLine();
                        hollowState.inHollowLineClamp = false;
                    } else {
                        tur.painter.doStartHollowLine();
                        hollowState.inHollowLineClamp = true;
                    }
                },
                timeout,
                () => logo.stopTurtle
            );
        }
    }
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return EmbeddedGraphicsScheduler;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { EmbeddedGraphicsScheduler };
}

if (typeof window !== "undefined") {
    window.EmbeddedGraphicsScheduler = EmbeddedGraphicsScheduler;
}
